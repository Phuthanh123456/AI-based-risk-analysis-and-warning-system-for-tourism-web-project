import { useTranslate, useLanguage, translateAddress, translateText } from "../i18n/index.js";import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { API_BASE } from "../api";
import { normalize } from "../tourism/catalog/provinces";
import { createLocationSearchClient } from "./locationSearchClient";

const suggestions = createLocationSearchClient({ baseUrl: API_BASE });

export default function LocationSearch({ label, text, selected, onTextChange, onPick, near, references = [] }) {const translate = useTranslate();
  const language = useLanguage();
  const address = value => translateAddress(value, language);
  const [search, setSearch] = useState({ query: "", items: [], status: "idle", attribution: "" });
  const [retry, setRetry] = useState(0);
  const query = text.trim();
  const lat = near?.lat;
  const lon = near?.lon;
  const selectedLabel = selected?.label;

  useEffect(() => {
    if (query.length < 3 || query === selectedLabel) return;
    const controller = new AbortController();
    let active = true;
    const debounce = setTimeout(async () => {
      setSearch((previous) => ({ ...previous, query, status: "loading" }));
      try {
        const result = await suggestions.search(query, lat, lon, controller.signal);
        if (active && !controller.signal.aborted) setSearch({ query, items: result.items || [], status: result.status, attribution: result.attribution });
      } catch {
        if (active) setSearch({ query, items: [], status: "unavailable", attribution: "" });
      }
    }, suggestions.peek(query, lat, lon) ? 0 : 220);
    return () => {active = false;clearTimeout(debounce);controller.abort();};
  }, [query, selectedLabel, lat, lon, retry]);

  const matchingReferences = references.filter((item) => !query || [item.label, translateText(item.label, "en")].some(name => normalize(name).includes(normalize(query))));
  const cached = suggestions.peek(query, lat, lon);
  const current = cached || (search.query === query ? search : { items: [], status: "idle", attribution: "" });
  // Never keep suggestions from an older query or accept unchecked providers.
  const remote = current.status === "ok" ? current.items.filter((item) => item.source === "photon" && item.osm_id && ["VN", "VNM"].includes(item.country_code) && Number.isFinite(item.lat) && Number.isFinite(item.lon)) : [];
  const options = [...remote, ...matchingReferences.filter((item) => !remote.some((item2) => item2.label === item.label))];
  const loading = query.length >= 3 && query !== selectedLabel && !cached && (current.status === "loading" || current.status === "idle");
  const helper = selected ?
  `Đã chọn: ${address(selected.label)}` :
  current.status === "unavailable" || current.status === "busy" ?
  "Nguồn địa chỉ đang bận. Bạn có thể tìm lại hoặc chọn điểm tham chiếu có sẵn." :
  "Gõ ít nhất 3 ký tự, rồi chọn đúng địa điểm và địa chỉ trong danh sách gợi ý.";

  return <Autocomplete
    fullWidth
    value={selected || null}
    inputValue={selectedLabel === text ? address(text) : text}
    options={options}
    filterOptions={(items) => items}
    getOptionLabel={(item) => address(item.label)}
    isOptionEqualToValue={(a, b) => a.id === b.id}
    onInputChange={(_event, value, reason) => {if (reason === "input" || reason === "clear") onTextChange(value);}}
    onChange={(_event, value) => {if (value) onPick(value);else onTextChange("");}}
    loading={loading}
    loadingText={translate("Đang tìm địa điểm…")}
    noOptionsText={translate(query.length < 3 ? "Nhập thêm ký tự để tìm địa chỉ" : "Chưa tìm thấy. Thử thêm tên đường, quận/huyện hoặc tỉnh/thành phố.")}
    openOnFocus
    autoHighlight
    clearOnBlur={false}
    renderOption={(props, item) => {
      const { key, ...optionProps } = props;
      return <Box component="li" key={key} {...optionProps} sx={{ gap: 1.5, alignItems: "flex-start !important", py: "12px !important" }}>
        <PlaceOutlinedIcon color="primary" sx={{ mt: 0.3, flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600}>{translate(item.name)}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflowWrap: "anywhere" }}>{address(item.label)}</Typography>
          {translate(item.source === "reference" && <Typography variant="caption" color="text.secondary">{translate("Điểm tham chiếu tỉnh/thành phố")}</Typography>)}
        </Box>
      </Box>;
    }}
    renderInput={(params) => <TextField {...params} label={translate(label)} required placeholder={translate("Tìm địa chỉ, tên đường hoặc địa điểm…")} helperText={translate(<>{translate(helper)}{translate((current.status === "unavailable" || current.status === "busy") && <button type="button" onClick={() => setRetry((value) => value + 1)} style={{ marginLeft: 6, border: 0, background: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", padding: "8px 4px" }}>{translate("Tìm lại")}</button>)}{translate(current.items.length > 0 && <><br />{translate("Nguồn gợi ý: ")}{translate(current.attribution)}</>)}</>)}
    slotProps={{ ...params.slotProps, input: { ...params.slotProps.input, endAdornment: <>{translate(loading && <CircularProgress color="inherit" size={17} />)}{translate(params.slotProps.input.endAdornment)}</> } }} />
    } />;

}

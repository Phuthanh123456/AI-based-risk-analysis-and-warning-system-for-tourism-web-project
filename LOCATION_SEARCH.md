# Address suggestion accuracy

TrackAsia autocomplete returned conflicting venue records for Hoan Kiem Lake,
including a record in Da Nang. Its suggestions are disabled. Routing still uses
its own configured services; this change concerns address suggestions only.

Suggestions now require a Photon/OpenStreetMap object ID, an explicit Vietnam
country code, finite coordinates in the configured bounds, and all query tokens
in the same record's address. Names, address and coordinates are never composed
from different features. Records matching known catalog names must also match
an expected current/former province. Exact names rank before similarly named
businesses; proximity only breaks remaining ties.

`node scripts/audit-location-catalog.mjs` checks all 90 catalog entries against
the 34-province directory (unique IDs, current/former mapping and source links)
and generates 81 non-food region constraints in `configs/search_place_regions.json`.
These checks validate metadata consistency, not the existence or exact location
of every tourism site. Province points are approximate reference points from
the existing configuration, not street addresses or surveyed boundaries.

Old saved selections are invalidated by `locationSearchVersion: 2`. The UI does
not retain suggestions from earlier queries or accept unchecked provider items.

If Photon is unavailable or rate limited, the service returns no address items;
it does not fall back to the known conflicting autocomplete. The 34 configured
province reference choices remain available. During this change, the public
Photon service initially returned HTTP 403 for the old query parameters; the
updated live endpoint returned the Hoan Kiem Lake OSM object 198437 in Hanoi.
Configure an accessible Photon instance through `PHOTON_API_URL` for deployment; this work does not claim
that all real-world addresses have been independently verified.

Validation: `python -m pytest tests/test_place_search.py -q` covers wrong-region
Hoan Kiem records, untraceable/fuzzy results, source rejection, selected
coordinates, cache, cancellation, deadlines and quotas.

---
layout: post
title:  "Use Grafana 5.0 with Volkszaehler MySQL database"
categories: Grafana visualization
---
### Add the MySQL datasource
Grafana supports in the standard installation already MySQL so just go to `Configuration - Data Sources - Add data source` and fill in the login information.
Note: It makes sense to create an additional database user with limited privileges, only `SELECT` on the Volkszaehler database is usually required. This can be done through phpMyAdmin (logged in as root).

### Quick overview of the Volkszaehler database structure
There are only 2 tables really necessary for reading, `data` and `properties`:
##### data
![vz data example]({{ "/assets/vz-data-structure.png" }})
This is the main table, containing all measured values, with the timestamp (in UNIX format, milliseconds since 1970) and the corresponding channel ID. More information about the channel can be obtained from `properties`, which is linked to these channel IDs.
##### properties
![vz properties example]({{ "/assets/vz-prop-structure.png" }})
Entity ID is the same as the channel ID from data, so it is possible to get for example the title for all channels from this table. 

### List all channels in a Grafana table
This is a simple test that show the ID with the titles, just create a new table panel in a Grafana dashboard and use the following query:
```sql
SELECT entity_id as ID, value as Name
FROM properties 
WHERE pkey = "title"
```

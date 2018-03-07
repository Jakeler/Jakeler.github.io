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

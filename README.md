

# SDV Courework
### Github Deployed Link
https://violah-15.github.io/SDV_Coursework/

### Acknowledgement

Datasets used for this visualization include:

- Data sourced from the Office for National Statistics (ONS) for housing and earnings ratios available at [ONS Housing and Earnings Ratios](https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/ratioofhousepricetoworkplacebasedearningslowerquartileandmedian).
- Data on residential property sales for administrative geographies from ONS available at [ONS Residential Sales](https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/residentialpropertysalesforadministrativegeographies).
- TopoJson data for London Boroughs from [Vega Datasets](https://vega.github.io/vega-datasets/data/londonBoroughs.json).

### Pre-processing Data

The data was processed in Python as follows:

1. Extracts data specifically for the London region by filtering rows based on region codes (e.g., E12000007). This involves reading specific sheets designated for the data types of interest (e.g., median house prices, earnings).
2. Columns related to specific years or terms (e.g., columns containing the term "Sep" or specific years) are selectively dropped or reformatted.
3. Combines data from multiple sources into a unified structure. For example, sales data and ratio data are merged based on common keys such as 'Local authority code' and 'Local authority name'. This results in a comprehensive dataset that aligns both types of data per local authority.
4. The script organizes the merged data into a nested dictionary, where each key (borough) has a nested structure containing yearly data on sales, house prices, earnings, and affordability ratios. This transformation is designed to facilitate easier access to data by year and borough, making it suitable for detailed analyses or visualization purposes.
5. The final structured data is saved in JSON format, making it easy to use in web applications, data services, or further analytical processes.

import pandas
import numpy as np
import scipy.stats.mstats as mstats

def get_ranks(np_array):
    print "original array has {0} total and {1} valid elements".format(
        np_array.size, np_array.size-np.count_nonzero(np.isnan(np_array)))

    #temp = np_array.argsort()
    #rank_array = np.empty(len(np_array), int)
    #rank_array[temp] = np.arange(len(np_array))

    rank_array = mstats.rankdata(np.ma.masked_invalid(np_array))
    rank_array[rank_array==0] = np.nan
    rank_array -= 1
    print "rank array has {0} max rank and {1} valid ranks".format(
        np.nanmax(rank_array),
        rank_array.size-np.count_nonzero(np.isnan(rank_array)))
    return rank_array

def drop_countries(df, country_col, drop_countries):
    if len(drop_countries) > 0:
        #print "From {0} countries, dropping {1}".format(len(df[country_col]), drop_countries)
        isin_filter = df[country_col].isin(drop_countries)
        #print "isin_filter", isin_filter
        index_labels = df[country_col][isin_filter].index.tolist()
        #print "Filtering indices {0}".format(index_labels)
        df.drop(index_labels, inplace=True)

def drop_columns(df, columns):
    if len(columns) > 0:
        #print "From {0} columns, dropping {1}".format(len(df.columns), columns)
        df.drop(columns, axis='columns', inplace=True)

def drop_allna(df, pivot_column):
    shape_before = df.shape
    column_subset = list(set(df.columns.tolist())-set([pivot_column]))
    df.dropna(axis=('index'), how='all',inplace=True, subset=column_subset)
    df.dropna(axis=('columns'), how='all',inplace=True)
    return shape_before != df.shape

#def set_nan(series, mask):

# Trim data frames df1 and df2 to equal shape assuming that they both have a
# column called join_call. This is done iteratively as follows
# 1. Trim rows that do not appear in both data frames
# 2. Trim columns that do not appear in both data frames
# 3. Trim all-blank rows and columns 
# 4. Go back to 1 if any frame was trimmed
# 5. Erase any field if it blank in any of the data frames so that the
#    blank fields are always paired.
def trim_to_equal_shape(df1, df2, join_col):
    trimmed = True
    while (trimmed):
        print "Current shapes, {0}, and {1}".format(df1.shape, df2.shape)

        # Remove rows that do not appear in both data frames
        df1_only_rows= [x for x in df1[join_col] if x not in set(df2[join_col])]
        df2_only_rows= [x for x in df2[join_col] if x not in set(df1[join_col])]
        drop_countries(df1, join_col, df1_only_rows)
        drop_countries(df2, join_col, df2_only_rows)

        # Remove columns that do not appear in both data frames
        df1_only_cols = [x for x in df1.columns if x not in set(df2.columns)]
        hdi_only_cols = [x for x in df2.columns if x not in set(df1.columns)]
        drop_columns(df1, df1_only_cols)
        drop_columns(df2, hdi_only_cols)

        # Remove rows and columns that are all na
        trimmed1 = drop_allna(df1, join_col)
        trimmed2 = drop_allna(df2, join_col)
        trimmed  = trimmed1 | trimmed2

    #print df1.head()
    #print df2.head()    
    for i in range(0, len(df1.index)):
        for j in range(0, len(df1.columns)):
            if pandas.isnull(df1.iloc[i,j]):
                df2.iloc[i,j] = np.NaN
            if pandas.isnull(df2.iloc[i,j]):
                df1.iloc[i,j] = np.NaN
    drop_allna(df1, join_col)
    drop_allna(df2, join_col)

    #missing_mask = df1.isnull().head() + df2.isnull().head()
    #df1.replace(to_replace=missing_mask, value=np.nan, inplace=True)
    #df2.replace(to_replace=missing_mask, value=np.nan, inplace=True)
    #other_cols = list(set(df1.columns.tolist())-set([join_col]))
    #for col in other_cols:
    #    set_nan(df1[col], missing_mask[col])
    #    set_nan(df2[col], missing_mask[col])
        
def wrangle_gdp_data(dataset_path, md_fname, gdp_fname, hdi_fname, master_filename):
    md_df = pandas.read_csv(dataset_path+md_fname)    
    gdp_df = pandas.read_csv(dataset_path+gdp_fname)
    hdi_df = pandas.read_csv(dataset_path+hdi_fname)

    # Trim gdp and hdi dataframes until they both have only data on the same
    # set of countries over the same set of years
    country_col = 'Country_Name'
    hdi_df.rename(columns= lambda x: country_col if x==hdi_df.columns[0] else x.replace(' ','_'), inplace=True)
    gdp_df.rename(columns= lambda x: country_col if x==gdp_df.columns[0] else x.replace(' ','_'), inplace=True)
    md_df.rename(columns= lambda x: country_col if x==md_df.columns[0] else x.replace(' ','_'), inplace=True)

    trim_to_equal_shape(gdp_df, hdi_df, country_col)
    print "shape of gdp_df = {0}".format(gdp_df.shape)
    print "shape of hdi_df = {0}".format(hdi_df.shape)

    # Join country metadata go get country code and region
    country_code_col = 'Country_Code'
    region_col = 'Region'
    id_cols = [country_col, country_code_col, region_col]
    
    rm_cols = [x for x in md_df.columns if x not in set(id_cols)]
    print rm_cols
    drop_columns(md_df, rm_cols)
    print md_df
    gdp_df = pandas.merge(gdp_df, md_df, how='left', on=[country_col])
    hdi_df = pandas.merge(hdi_df, md_df, how='left', on=[country_col])
    print gdp_df.head()
    #code_nan_count = gdp_df[country_code_col].size - np.count_nonzero(
    #    np.isnull(gdp_df[country_code_col].values))
    #print "Number of blank in 'Code' column = ", code_nan_count
    #reg_nan_count = gdp_df[region_col].size - np.count_nonzero(np.isnull(
    #    gdp_df[region_col].values))
    #print "Number of blank in 'Region' column = ", reg_nan_count

    # Create rank data bases from the original databases
    gdp_rank_df = gdp_df[id_cols]
    hdi_rank_df = hdi_df[id_cols]
    year_cols = [x for x in gdp_df.columns if x not in set(id_cols)]
    for year in year_cols:
        gdp_rank_df.loc[:,year] = get_ranks(gdp_df[year].values)
        hdi_rank_df.loc[:,year] = get_ranks(hdi_df[year].values)

    print gdp_rank_df.head()
    print hdi_rank_df.head()

    # Create long format data with year as a variable
    var_col = 'Year'
    hdi_indicator = 'HDI'
    gdp_indicator = 'GDP'
    hdi_df_melt = pandas.melt(hdi_rank_df, id_vars=id_cols, var_name=var_col, value_name=hdi_indicator)
    gdp_df_melt = pandas.melt(gdp_rank_df, id_vars=id_cols, var_name=var_col, value_name=gdp_indicator)

    # Join the two data frames on common countries
    gdp_hdi_df = pandas.merge(gdp_df_melt, hdi_df_melt, on=id_cols.append(var_col))
    print gdp_hdi_df.head()
    gdp_hdi_df.dropna(axis=('index'), how='all',inplace=True)
    # remove outlier countries e.g. Luxemburg
    #gdp_hdi_df = gdp_hdi_df[gdp_hdi_df.Country_Name != "Luxembourg"]

    gdp_hdi_df.to_csv(master_filename)


if __name__ == '__main__':
    dataset_path = './'
    master_data_fname = "rank_gdp_hdi.csv"
    # Fix and combine gdp and hdi data files into one master csv file
    md_fname = dataset_path + 'country_metadata.csv'
    gdp_fname = dataset_path + 'gdp_data.csv'
    #gdp_fname = dataset_path + 'ny.gdp.pcap.kd_Indicator_en_csv_v2.csv'
    hdi_fname = dataset_path + 'hdi_data.csv'
    wrangle_gdp_data(dataset_path, md_fname, gdp_fname, hdi_fname,
                     master_data_fname)
    #gdp_df = pandas.read_csv(dataset_path+master_data_fname)
    #gdp_df = fix_master_data(gdp_df)


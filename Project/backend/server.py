'''
pip install -U flask --user
pip install -U flask-cors --user
pip install -U numpy --user
pip install -U pandas --user
'''

from flask import Flask
from flask import request, jsonify
from flask_cors import CORS, cross_origin

import numpy
import pandas as pd
from sklearn.externals import joblib
import pickle
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix
from sklearn.externals import joblib



app = Flask(__name__)
cors = CORS(app)

@app.route('/buildmodel', methods=['POST'])
@cross_origin()
def build_model():
    collision_df = pd.read_csv("D:\\MACS\\Visual Analytics\\Project\\NYPD_Motor_Vehicle_Collisions.csv")
    #dropping the unnecessary columns which have large number of number of null values
    collision_df.drop(['ZIP CODE','LOCATION', 'ON STREET NAME', 'CROSS STREET NAME','OFF STREET NAME','CONTRIBUTING FACTOR VEHICLE 1', 'CONTRIBUTING FACTOR VEHICLE 2','CONTRIBUTING FACTOR VEHICLE 3', 'CONTRIBUTING FACTOR VEHICLE 4','CONTRIBUTING FACTOR VEHICLE 5', 'UNIQUE KEY', 'VEHICLE TYPE CODE 1','VEHICLE TYPE CODE 2', 'VEHICLE TYPE CODE 3', 'VEHICLE TYPE CODE 4','VEHICLE TYPE CODE 5'], axis=1, inplace=True)
    #Replace unspecified values with NaN
    collision_df = collision_df.replace('Unspecified', np.nan)
    #Dropping the null values
    collision_df.dropna(inplace=True)

    #Sum all the injured or killed columns in to Total column and use it as the target label
    collision_df['Total']= collision_df.iloc[:, 5:14].sum(axis=1)
    collision_df_slice = collision_df.iloc[0:200000,:]
    
    collision_df_positive = collision_df.iloc[200001:600000,:]
    #Extracting positive class data points
    collision_df_positive_points = collision_df_positive[collision_df_positive['Total'] != 0]
    # Adding positive class dataframe to handle imbalanced classes
    collision_df = pd.concat([collision_df_slice,collision_df_positive_points], ignore_index=True)

    #Converting all positive class data points to 1 code referenced from https://stackoverflow.com/questions/47382933/replace-non-zero-values-with-1
    collision_df['Total'] = collision_df['Total'].astype(bool).astype(int)

    # Shuffle the dataframe code referenced from https://stackoverflow.com/questions/15772009/shuffling-permutating-a-dataframe-in-pandas?noredirect=1&lq=1
    collision_df = collision_df.reindex(np.random.permutation(collision_df.index))
    collision_df.reset_index(drop=True, inplace=True)

    collision_df.drop(['NUMBER OF PERSONS INJURED', 'NUMBER OF PERSONS KILLED',
        'NUMBER OF PEDESTRIANS INJURED', 'NUMBER OF PEDESTRIANS KILLED',
        'NUMBER OF CYCLIST INJURED', 'NUMBER OF CYCLIST KILLED',
        'NUMBER OF MOTORIST INJURED', 'NUMBER OF MOTORIST KILLED'], axis=1, inplace=True)

    #Converting the DATE and TIME columns to datetime format columns
    collision_df['DATE'] = pd.to_datetime(collision_df.DATE)
    collision_df['TIME'] = pd.to_datetime(collision_df.TIME)

    #Converting the hour, month and day features to cyclic features code referenced from http://blog.davidkaleko.com/feature-engineering-cyclical-features.html
    collision_df['HOUR_SINE'] = np.sin((collision_df['TIME'].dt.hour)*(2.*np.pi/24))
    collision_df['HOUR_COSINE'] = np.cos((collision_df['TIME'].dt.hour)*(2.*np.pi/24))
    collision_df['MONTH_SINE'] = np.sin((collision_df['DATE'].dt.month)*(2.*np.pi/12))
    collision_df['MONTH_COSINE'] = np.cos((collision_df['DATE'].dt.month)*(2.*np.pi/12))
    collision_df['DAY_SINE'] = np.sin((collision_df['DATE'].dt.day)*(2.*np.pi/30))
    collision_df['DAY_COSINE'] = np.cos((collision_df['DATE'].dt.day)*(2.*np.pi/30))

    #Converting the Latitude and Logitude to useful features for the algorithm code referenced from  https://datascience.stackexchange.com/questions/13567/ways-to-deal-with-longitude-latitude-feature
    collision_df['LATITUDE_AND_LONGITUDE_X'] = np.cos(collision_df['LATITUDE']) * np.cos(collision_df['LONGITUDE'])
    collision_df['LATITUDE_AND_LONGITUDE_Y'] = np.cos(collision_df['LATITUDE']) * np.sin(collision_df['LONGITUDE']) 
    collision_df['LATITUDE_AND_LONGITUDE_Z'] = np.sin(collision_df['LATITUDE'])

    #Dropping the columns DATA, TIME, LATITUDE and LONGITUDE after making the necessary conversions
    collision_df = collision_df.drop(["DATE", 'TIME', 'LATITUDE', 'LONGITUDE'], axis=1)

    #Converting the categorical features to one hot encoding using pd.get_dummies
    collision_df = pd.get_dummies(collision_df)

    #Taking the features from the dataframe
    collision_df_X_features = collision_df.drop('Total', axis=1)
    #Taking the target column which is the Total column
    collision_df_y_target = collision_df.Total

    #Splitting the dataset to train and test set in the ratio 70:30
    collision_df_features_train, collision_df_features_test, collision_df_target_train, collision_df_target_test = train_test_split(collision_df_X_features, collision_df_y_target, test_size=0.3, random_state=34)

    #After running random forest algorithm using grid_search cv we have taken the best parameters that the algorithm has given
    #and used them for the final model.
    random_forest_classifier = RandomForestClassifier(n_estimators=300, max_depth=10,max_features= 'sqrt',random_state=0, n_jobs=-1)
    random_forest_classifier.fit(collision_df_features_train,collision_df_target_train)
    #Saving the final random_forest_classifier model for predictions
    file_name_path = 'C:\\Users\\Abraham Vineel\\Desktop\\final_random_forest_model.sav'
    joblib.dump(random_forest_classifier, file_name_path)
    return "Model Successfully built and Saved"

@app.route('/predict', methods=['POST'])
@cross_origin()
def predict():
    loaded_model = joblib.load("../model/random_forest_model.sav")
    date = request.args.get('date')
    time = request.args.get('time')
    latitude = request.args.get('latitude')
    longitude=request.args.get('longitude')
    borough=request.args.get('borough')
    date = datetime.strptime(date,'%Y-%m-%d')
    time = datetime.strptime(time,'%H:%M')
    prediction_list=[]
    hour_sin,hour_cos=angle_datetime(time.hour,24)
    prediction_list.append(hour_sin)
    prediction_list.append(hour_cos)
    month_sin,month_cos=angle_datetime(date.month,12)
    prediction_list.append(month_sin)
    prediction_list.append(month_cos)
    day_sin,day_cos=angle_datetime(date.day,30)
    prediction_list.append(day_sin)
    prediction_list.append(day_cos)
    latitude=float(latitude)
    longitude=float(longitude)
    latitute_and_longitude_x = np.cos(latitude) * np.cos(longitude)
    prediction_list.append(latitute_and_longitude_x)
    latitute_and_longitude_y = np.cos(latitude) * np.sin(longitude) 
    prediction_list.append(latitute_and_longitude_y)
    latitute_and_longitude_z = np.sin(latitude)
    prediction_list.append(latitute_and_longitude_z)
    binary_borough_arr=borough.split(",")
    for value in binary_borough_arr:
        prediction_list.append(float(value))
    y_pred = loaded_model.predict_proba([prediction_list])
    print(prediction_list)
    collision_predction_percentage=str(y_pred[0][1])
    return jsonify({"collision_predction_percentage":collision_predction_percentage})

#convert date and time to useful features
def angle_datetime(current,max):
    sin = np.sin((current)*(2.*np.pi/max))
    cos = np.cos((current)*(2.*np.pi/max))
    return sin,cos

if __name__ == '__main__':
    app.run(debug=True)

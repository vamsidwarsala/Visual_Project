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


app = Flask(__name__)
cors = CORS(app)


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

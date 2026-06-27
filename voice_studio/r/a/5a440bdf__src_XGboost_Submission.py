# -*- coding: utf-8 -*-
"""
Created on Sun Apr 15 09:38:03 2018

@author: User
"""

import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import os 
import pickle
import librosa
import librosa.display
import matplotlib.pyplot as plt  
from sklearn.model_selection import train_test_split
import xgboost as xgb
from sklearn.metrics import accuracy_score
from scipy.stats import skew
SAMPLE_RATE = 22050
DURATION = 5 
import scipy
#from sklearn.model_selection import KFold, RepeatedKFold
from tqdm import tqdm, tqdm_pandas
os.chdir("C:\\Users\\User\\Documents\\GIT\\Kaggle-Kernel-Speech-Accent-Archive\\")

########################
# Create core functions
########################
def proba2labels(preds, i2c, k=3):
    ans = []
    ids = []
    for p in preds:
        idx = np.argsort(p)[::-1]
        ids.append([i for i in idx[:k]])
        ans.append(' '.join([i2c[i] for i in idx[:k]]))

    return ans, ids


# returns mfcc features with mean, std, skew, max and min across spectral features
#def get_mfcc(name, path):
#    b, _ = librosa.core.load(path + name, sr = SAMPLE_RATE,  duration = DURATION)
#    assert _ == SAMPLE_RATE
#    try:
#        ft1 = librosa.feature.mfcc(b, sr = SAMPLE_RATE, n_mfcc=20)
#        ft2 = librosa.feature.zero_crossing_rate(b)[0]
#        ft3 = librosa.feature.spectral_rolloff(b)[0]
#        ft4 = librosa.feature.spectral_centroid(b)[0]
#        ft5 = librosa.feature.spectral_contrast(b)[0]
#        ft6 = librosa.feature.spectral_bandwidth(b)[0]
#        ft1_trunc = np.hstack((np.mean(ft1, axis=1), np.std(ft1, axis=1), skew(ft1, axis = 1), np.max(ft1, axis = 1), np.min(ft1, axis = 1)))
#        ft2_trunc = np.hstack((np.mean(ft2), np.std(ft2), skew(ft2), np.max(ft2), np.min(ft2)))
#        ft3_trunc = np.hstack((np.mean(ft3), np.std(ft3), skew(ft3), np.max(ft3), np.min(ft3)))
#        ft4_trunc = np.hstack((np.mean(ft4), np.std(ft4), skew(ft4), np.max(ft4), np.min(ft4)))
#        ft5_trunc = np.hstack((np.mean(ft5), np.std(ft5), skew(ft5), np.max(ft5), np.min(ft5)))
#        ft6_trunc = np.hstack((np.mean(ft6), np.std(ft6), skew(ft6), np.max(ft6), np.min(ft6)))
#        return pd.Series(np.hstack((ft1_trunc, ft2_trunc, ft3_trunc, ft4_trunc, ft5_trunc, ft6_trunc)))
#    except:
#        print('bad file')
#        return pd.Series([0]*125)


# returns mfcc features with mean, std, skew, max and min across spectral features
def get_feat(name, path):
    # Remember this fuction to load 
    y, _ = librosa.core.load(path + name, sr = SAMPLE_RATE, duration = DURATION)    # sample rate of 22050 like I mentioned in Part 2 
    assert _ == SAMPLE_RATE
    try:
        # MFCC 
        mfcc = librosa.feature.mfcc(y, sr = SAMPLE_RATE, n_mfcc=20)  # number of MFCC bands set to 20 
        
        # Log Mel-spectogram 
        spec = librosa.feature.melspectrogram(y, sr=SAMPLE_RATE, n_mels=128)
        log_S = librosa.amplitude_to_db(spec)
        
        # Chroma 
        C = librosa.feature.chroma_cqt(y=y, sr=SAMPLE_RATE)
        
        
        # get MFCC's statistical features  
        mfcc = np.hstack((np.mean(mfcc, axis=1), np.std(mfcc, axis=1), skew(mfcc, axis = 1), np.max(mfcc, axis = 1), np.min(mfcc, axis = 1)))
        log_S = np.hstack((np.mean(log_S, axis=1), np.std(log_S, axis=1), skew(log_S, axis = 1), np.max(log_S, axis = 1), np.min(log_S, axis = 1)))
        C = np.hstack((np.mean(C, axis=1), np.std(C, axis=1), skew(C, axis = 1), np.max(C, axis = 1), np.min(C, axis = 1)))
        return pd.Series(np.hstack((mfcc, log_S, C)))
    except:
        print('bad file')
        return pd.Series([0]*125)
    
    
    
# returns wave features with mean, max, min and standard deviation, across various lengths of time
def wave_feat(name, path):
    features = {}

    cnt = 0
    for f in tqdm(name):
        features[f] = {}

        #fs, data = scipy.io.wavfile.read(os.path.join(path, f))
        y, _ = librosa.core.load(path + f, sr = SAMPLE_RATE, duration = DURATION)  
        
        abs_data = np.abs(y)
        diff_data = np.diff(y)

        def calc_part_features(y, n=2, prefix=''):
            f_i = 1
            for i in range(0, len(y), len(y)//n):
                features[f]['{}mean_{}_{}'.format(prefix, f_i, n)] = np.mean(y[i:i + len(y)//n])
                features[f]['{}std_{}_{}'.format(prefix, f_i, n)] = np.std(y[i:i + len(y)//n])
                features[f]['{}min_{}_{}'.format(prefix, f_i, n)] = np.min(y[i:i + len(y)//n])
                features[f]['{}max_{}_{}'.format(prefix, f_i, n)] = np.max(y[i:i + len(y)//n])

        features[f]['len'] = len(y)
        if features[f]['len'] > 0:
            n = 1
            calc_part_features(y, n=n)
            calc_part_features(abs_data, n=n, prefix='abs_')
            calc_part_features(diff_data, n=n, prefix='diff_')

            n = 2
            calc_part_features(y, n=n)
            calc_part_features(abs_data, n=n, prefix='abs_')
            calc_part_features(diff_data, n=n, prefix='diff_')

            n = 3
            calc_part_features(y, n=n)
            calc_part_features(abs_data, n=n, prefix='abs_')
            calc_part_features(diff_data, n=n, prefix='diff_')
            
            n = 4
            calc_part_features(y, n=n)
            calc_part_features(abs_data, n=n, prefix='abs_')
            calc_part_features(diff_data, n=n, prefix='diff_')

        cnt += 1

        # if cnt >= 1000:
        #     break

    features = pd.DataFrame(features).T.reset_index()
    features.rename(columns={'index': 'fname'}, inplace=True)
    
    return features


#######################
# Load data
#######################
    
tqdm.pandas()  # need this to get the progress_apply 

df = pd.read_csv("speakers_all.csv")
df.drop(df.columns[9:12],axis = 1, inplace = True)
df = df.loc[df['file_missing?'] == False]

# encountered some issues: 
df = df.loc[df['filename'] != 'sinhalese1']
df = df.loc[df['filename'] != 'nicaragua']

df = df.loc[df['sex'] != 'famale']

target = df['sex']
X_train, X_test, y_train, y_test = train_test_split(df, target, test_size=0.33, random_state=42)
train_files = X_train['filename']+".mp3"
test_files = X_test['filename']+".mp3"

#######################
# testing on one file 
#######################
# To demonstrate, we'll use a 5 second audio, and a sampling rate of 10000 
fname_f = 'recordings\\' + 'english385.mp3'    # female from Kentucky
y, _ = librosa.load(fname_f, sr=5000, duration = DURATION)  


# MFCC
y = librosa.feature.mfcc(y, n_mfcc=20)

# melspec
spec = librosa.feature.melspectrogram(y, sr=SAMPLE_RATE, n_mels=128)
y = librosa.amplitude_to_db(spec)

# Chroma
y = librosa.feature.chroma_cqt(y=y, sr=SAMPLE_RATE)
        
plt.figure(figsize=(12, 6))
plt.subplot(3,1,1)
librosa.display.specshow(y)
plt.ylabel('MFCC')
plt.colorbar()


# mean
y_mean = np.mean(y, axis=1)
print(y_mean.shape) 

# Standard deviation 
y_stdev = np.std(y, axis=1)
print(y_stdev.shape)

# max 
y_max = np.max(y, axis=1)
print(y_max.shape)

# min 
y_min = np.min(y, axis=1)
print(y_min.shape)

# median
y_median = np.median(y, axis=1)
print(y_median.shape)

# skew
y_skew = skew(y, axis=1)
print(y_skew.shape)

# Now stack them all horizontally (row wise)
y = np.hstack((y_mean, y_stdev, y_max, y_min, y_median, y_skew))
print(y.shape)


#######################
# Feature extraction  - frequency domain
#######################
# takes xxx 
X_train['fname'] = X_train['filename']+".mp3"
X_train = X_train['fname'].progress_apply(get_feat, path='recordings\\')

# takes xxx 
X_test['fname'] = X_test['filename']+".mp3"
X_test = X_test['fname'].progress_apply(get_feat, path='recordings\\')


#######################
# Feature extraction  - time domain
#######################

# Takes 
train_wave = wave_feat(train_files,  path='recordings\\')

# takes 
test_wave = wave_feat(test_files,  path='recordings\\')


# Combined the 2 sets of features 
train_data = train_data.merge(train_features, on='fname', how='left')
test_data = test_data.merge(test_features, on='fname', how='left')
train_data.head()


#######################
# Data preparation 
#######################
# Load the data
tqdm.pandas()
data_path = 'data\\'
ss = pd.read_csv(os.path.join(data_path, 'sample_submission.csv'))

audio_files = os.listdir('recordings\\')

train = pd.read_csv('data\\train.csv')
submission = pd.read_csv('data\\sample_submission.csv')

#preparing data
train_data = pd.DataFrame()
train_data['fname'] = train['fname']
test_data = pd.DataFrame()
test_data['fname'] = audio_test_files

#######################
# Feature extraction
#######################
# extract the features from the MFCC
# 20 to 30 mins to extract  
train_data = train_data['fname'].progress_apply(get_mfcc, path='data\\audio_train\\')
print('done loading train mfcc')

test_data = test_data['fname'].progress_apply(get_mfcc, path='data\\audio_test\\')
print('done loading test mfcc')

train_data['fname'] = train['fname']
test_data['fname'] = audio_test_files
train_data['label'] = train['label']
test_data['label'] = np.zeros((len(audio_test_files)))
train_data.head()



# Combined the 2 sets of features 
train_data = train_data.merge(train_features, on='fname', how='left')
test_data = test_data.merge(test_features, on='fname', how='left')
train_data.head()

# pickel the 2 datasets for reuse
filename = 'data\\train_data v1.2.sav'
pickle.dump(train_data, open(filename, 'wb'))

filename = 'data\\test_data v1.2.sav'
pickle.dump(test_data, open(filename, 'wb'))

# train_data = pickle.load(open('data\\train_data v1.2.sav', 'rb'))
# test_data = pickle.load(open('data\\test_data v1.2.sav', 'rb'))

#######################
# Modelling
#######################
# containers for information 
X = train_data.drop(['label', 'fname'], axis=1)
feature_names = list(X.columns)
X = X.values
labels = np.sort(np.unique(train_data.label.values))

# get the classes into integer and store the mapping values
num_class = len(labels)
c2i = {}
i2c = {}
for i, c in enumerate(labels):
    c2i[c] = i
    i2c[i] = c
y = np.array([c2i[x] for x in train_data.label.values])


# split the data into 20% validation 80% training. Shuffle it and set randomstate
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=34523, shuffle = True)

# Setting the parameters 
params = {}
params['objective'] = 'multi:softprob'
params['eval_metric'] = 'mlogloss' #'merror' 'map@3' param['eval_metric'] = ['mlogloss', 'ams@0']  # http://xgboost.readthedocs.io/en/latest/parameter.html
params['num_class'] = 41
params['eta'] = 0.01
params['max_depth'] = 8
params['subsample'] = 0.8
params['scale_pos_weight'] = 1 
params['colsample_bytree'] = 0.8
params['min_child_weight'] = 1
params['silent'] = 0
params['seed'] = 3456

# coerce the dataframe into an XGB matrix for speed
d_train = xgb.DMatrix(X_train, label=y_train)
d_valid = xgb.DMatrix(X_val, label=y_val)
watchlist = [(d_train, 'train'), (d_valid, 'valid')]

num_round = 400
bst = xgb.train(params, d_train
                , num_round
                , watchlist
                #, early_stopping_rounds=10
                , verbose_eval=1
                )

# to monitor the convergence / overfitting - https://machinelearningmastery.com/avoid-overfitting-by-early-stopping-with-xgboost-in-python/
# to plot feature importance - - http://xgboost.readthedocs.io/en/latest/python/python_intro.html
#
d_test = xgb.DMatrix(X_val)
p_test = bst.predict(d_test)
y_pred = p_test.argmax(axis=-1)
print(accuracy_score(y_pred, y_val))
# 0.6844327176781002

# get the output into the correct file format for MAP@3
str_preds,label_ids  = proba2labels(p_test, i2c, k=3)
actual = [[v] for v in y_val] # y[y_val]]
map3 = mapk(actual, label_ids, k=3)
print(map3)
# 0.7485488126649077


##############################
# Predict on test dataset 
##############################

test_data = test_data.drop(['label', 'fname'], axis = 1)
feature_names = list(test_data.columns)
X_test = test_data.values

X_test = xgb.DMatrix(X_test)
p_test = bst.predict(X_test)

# get the output into the correct file format for MAP@3
str_preds,label_ids  = proba2labels(p_test, i2c, k=3)

##############################
# Prepare submission
##############################
audio_test_files = os.listdir('data\\audio_test\\')
subm = pd.DataFrame()
subm['fname'] = audio_test_files
subm['label'] = str_preds
subm.to_csv('submissions\\Submission Xgboost.csv', index=False)

# Public LB = 0.777408
# Private LB = 0.745830
# Tune the num_round = 3000 and above to get an even higher score 


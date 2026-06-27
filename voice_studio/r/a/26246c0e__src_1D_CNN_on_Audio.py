# -*- coding: utf-8 -*-
"""
Created on Sat May 19 15:53:51 2018

@author: User
"""


# Change this to True to replicate the result
COMPLETE_RUN = True

import numpy as np
np.random.seed(1001)

import os
import shutil
import datetime
from pytz import timezone 
import IPython
import matplotlib
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from tqdm import tqdm_notebook
from sklearn.cross_validation import StratifiedKFold
import os 
os.chdir("C:\\Users\\User\\Documents\\GIT\\180330-freesound-general-purpose-audio-tagging-challenge\\")
#%matplotlib inline
matplotlib.style.use('ggplot')
INIT_PATH = 'data\\'

train = pd.read_csv(os.path.join(INIT_PATH, 'train.csv'))
test = pd.read_csv(os.path.join(INIT_PATH, 'sample_submission.csv'))

import librosa
import numpy as np
import scipy
from keras import losses, models, optimizers
from keras.activations import relu, softmax
from keras.callbacks import (EarlyStopping, LearningRateScheduler,
                             ModelCheckpoint, TensorBoard, ReduceLROnPlateau)
from keras.layers import (Convolution1D, Dense, Dropout, GlobalAveragePooling1D, 
                          GlobalMaxPool1D, Input, MaxPool1D, concatenate)
from keras.utils import Sequence, to_categorical

class Config(object):
    def __init__(self,
                 sampling_rate=16000, audio_duration=2, n_classes=41,
                 use_mfcc=False, n_folds=10, learning_rate=0.0001, 
                 max_epochs=50                                        
                 , n_mfcc=10
                 ):
        self.sampling_rate = sampling_rate
        self.audio_duration = audio_duration
        self.n_classes = n_classes
        self.use_mfcc = use_mfcc
        self.n_mfcc = n_mfcc
        self.n_folds = n_folds
        self.learning_rate = learning_rate
        self.max_epochs = max_epochs

        self.audio_length = self.sampling_rate * self.audio_duration
        if self.use_mfcc:
            self.dim = (self.n_mfcc, 1 + int(np.floor(self.audio_length/512)), 1)
        else:
            self.dim = (self.audio_length, 1)
            
            
class DataGenerator(Sequence):
    def __init__(self, config, data_dir, list_IDs, labels=None, 
                 batch_size=64, preprocessing_fn=lambda x: x):
        self.config = config
        self.data_dir = data_dir
        self.list_IDs = list_IDs
        self.labels = labels
        self.batch_size = batch_size
        self.preprocessing_fn = preprocessing_fn
        self.on_epoch_end()
        self.dim = self.config.dim

    def __len__(self):
        return int(np.ceil(len(self.list_IDs) / self.batch_size))

    def __getitem__(self, index):
        indexes = self.indexes[index*self.batch_size:(index+1)*self.batch_size]
        list_IDs_temp = [self.list_IDs[k] for k in indexes]
        return self.__data_generation(list_IDs_temp)

    def on_epoch_end(self):
        self.indexes = np.arange(len(self.list_IDs))

    def __data_generation(self, list_IDs_temp):
        cur_batch_size = len(list_IDs_temp)
        X = np.empty((cur_batch_size, *self.dim))

        input_length = self.config.audio_length
        for i, ID in enumerate(list_IDs_temp):
            file_path = self.data_dir + ID
            
            # Read and Resample the audio
            data, _ = librosa.core.load(file_path, sr=self.config.sampling_rate,
                                        res_type='kaiser_fast')

            # Random offset / Padding
            if len(data) > input_length:
                max_offset = len(data) - input_length
                offset = np.random.randint(max_offset)
                data = data[offset:(input_length+offset)]
            else:
                if input_length > len(data):
                    max_offset = input_length - len(data)
                    offset = np.random.randint(max_offset)
                else:
                    offset = 0
                data = np.pad(data, (offset, input_length - len(data) - offset), "constant")
                
            # Normalization + Other Preprocessing
            if self.config.use_mfcc:
                data = librosa.feature.mfcc(data, sr=self.config.sampling_rate,
                                                   n_mfcc=self.config.n_mfcc)
                data = np.expand_dims(data, axis=-1)
            else:
                data = self.preprocessing_fn(data)[:, np.newaxis]
            X[i,] = data

        if self.labels is not None:
            y = np.empty(cur_batch_size, dtype=int)
            for i, ID in enumerate(list_IDs_temp):
                y[i] = self.labels[ID]
            return X, to_categorical(y, num_classes=self.config.n_classes)
        else:
            return X
        
    
def audio_norm(data):
    max_data = np.max(data)
    min_data = np.min(data)
    data = (data-min_data)/(max_data-min_data+1e-6)
    return data-0.5



def get_1d_conv_model(config):
    
    nclass = config.n_classes
    input_length = config.audio_length
    
    inp = Input(shape=(input_length,1))
    x = Convolution1D(16, 9, activation=relu, padding="valid")(inp)  #16
    x = Convolution1D(16, 9, activation=relu, padding="valid")(x)    #16
    x = MaxPool1D(16)(x)     #16
    x = Dropout(rate=0.1)(x)
    
    x = Convolution1D(32, 3, activation=relu, padding="valid")(x)   #32
    x = Convolution1D(32, 3, activation=relu, padding="valid")(x)   #32
    x = MaxPool1D(4)(x)    #4
    x = Dropout(rate=0.1)(x)
    
    x = Convolution1D(32, 3, activation=relu, padding="valid")(x)  #32
    x = Convolution1D(32, 3, activation=relu, padding="valid")(x)   #32
    x = MaxPool1D(4)(x)   #4
    x = Dropout(rate=0.1)(x)    
    
    x = Convolution1D(256, 3, activation=relu, padding="valid")(x)   
    x = Convolution1D(256, 3, activation=relu, padding="valid")(x)
    x = GlobalMaxPool1D()(x)
    x = Dropout(rate=0.2)(x)

    x = Dense(64, activation=relu)(x)
    x = Dense(1028, activation=relu)(x)
    out = Dense(nclass, activation=softmax)(x)

    model = models.Model(inputs=inp, outputs=out)
    opt = optimizers.Adam(config.learning_rate)

    model.compile(optimizer=opt, loss=losses.categorical_crossentropy, metrics=['acc'])
    return model


LABELS = list(train.label.unique())
label_idx = {label: i for i, label in enumerate(LABELS)}
train.set_index("fname", inplace=True)
test.set_index("fname", inplace=True)
train["label_idx"] = train.label.apply(lambda x: label_idx[x])

###################
# Get ready for modelling 
###################

config = Config(sampling_rate=33000    # 16000
                , audio_duration=2 
                , n_folds=5          # 10 
                , learning_rate=0.001    # 0.001
                , max_epochs=200                                        
                )  

# time it 
start = datetime.datetime.now(timezone('Australia/Sydney')).strftime("%I:%M:%S %p")

PREDICTION_FOLDER = "predictions_1d_conv_GEN4_3"
if not os.path.exists(PREDICTION_FOLDER):
    os.mkdir(PREDICTION_FOLDER)
if os.path.exists('logs/' + PREDICTION_FOLDER):
    shutil.rmtree('logs/' + PREDICTION_FOLDER)

skf = StratifiedKFold(train.label_idx, n_folds=config.n_folds)

# And now for the loop 
for i, (train_split, val_split) in enumerate(skf):
    train_set = train.iloc[train_split]
    val_set = train.iloc[val_split]
    checkpoint = ModelCheckpoint('predictions_1d_conv_GEN4_3\\best_%d.h5'%i, monitor='val_loss', verbose=1, save_best_only=True)
    
    callbacks_list = [checkpoint]  
    
    print("#"*50)
    model = get_1d_conv_model(config)
    train_generator = DataGenerator(config, 'data\\audio_train\\', train_set.index, 
                                    train_set.label_idx, batch_size=64,
                                    preprocessing_fn=audio_norm)
    val_generator = DataGenerator(config, 'data\\audio_train\\', val_set.index, 
                                  val_set.label_idx, batch_size=64,
                                  preprocessing_fn=audio_norm)

    history = model.fit_generator(train_generator, callbacks=callbacks_list, validation_data=val_generator,
                                  
                                  epochs=config.max_epochs
                                  
                                  , max_queue_size=20)

    model.load_weights('predictions_1d_conv_GEN4_3\\best_%d.h5'%i)

    # Save train predictions
    train_generator = DataGenerator(config, 'data\\audio_train\\', train.index, batch_size=128,
                                    preprocessing_fn=audio_norm)
    predictions = model.predict_generator(train_generator
                                          , max_queue_size=20, verbose=1)
    np.save(PREDICTION_FOLDER + "\\train_predictions_%d.npy"%i, predictions)

    # Save test predictions
    test_generator = DataGenerator(config, 'data\\audio_test\\', test.index, batch_size=128,
                                    preprocessing_fn=audio_norm)
    predictions = model.predict_generator(test_generator
                                          , max_queue_size=20, verbose=1)
    np.save(PREDICTION_FOLDER + "\\test_predictions_%d.npy"%i, predictions)

    # Make a submission file
    top_3 = np.array(LABELS)[np.argsort(-predictions, axis=1)[:, :3]]
    predicted_labels = [' '.join(list(x)) for x in top_3]
    test['label'] = predicted_labels
    test[['label']].to_csv(PREDICTION_FOLDER + "\\predictions_%d.csv"%i)
    
end = datetime.datetime.now(timezone('Australia/Sydney')).strftime("%I:%M:%S %p")

print(start, '<--->', end)


############################
# Evaluation
############################    
pred_list = []
for i in range(5):
    pred_list.append(np.load("predictions_1d_conv_GEN4_3\\test_predictions_%d.npy"%i))
prediction = np.ones_like(pred_list[0])
for pred in pred_list:
    prediction = prediction*pred
prediction = prediction**(1./len(pred_list))


############################
# Make a submission file
############################
top_3 = np.array(LABELS)[np.argsort(-prediction, axis=1)[:, :3]]
predicted_labels = [' '.join(list(x)) for x in top_3]
test = pd.read_csv('data\\sample_submission.csv')
test['label'] = predicted_labels
test[['fname', 'label']].to_csv("submissions\\Sub 56.5 - 1d_conv_SampRate_GEN4.csv", index=False)


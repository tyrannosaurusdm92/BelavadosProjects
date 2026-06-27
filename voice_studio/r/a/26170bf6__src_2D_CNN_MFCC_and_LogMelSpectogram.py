# -*- coding: utf-8 -*-
"""
Created on Sat May 19 18:28:25 2018

@author: User
"""

import shutil
import numpy as np
import datetime
from pytz import timezone 
import pandas as pd
from sklearn.cross_validation import StratifiedKFold
from keras.callbacks import (EarlyStopping, LearningRateScheduler,
                             ModelCheckpoint, TensorBoard, ReduceLROnPlateau)
from keras import losses, models, optimizers
from keras.activations import relu, softmax
from keras.layers import (Convolution2D, GlobalAveragePooling2D, BatchNormalization, Flatten, Dropout,
                          GlobalMaxPool2D, MaxPool2D, concatenate, Activation, Input, Dense)
from keras.utils import Sequence, to_categorical
from keras import backend as K
import os 
os.chdir("C:\\Users\\User\\Documents\\GIT\\180330-freesound-general-purpose-audio-tagging-challenge\\")
INIT_PATH = 'data\\'
import librosa


class Config(object):
    def __init__(self,
                 sampling_rate=16000, audio_duration=2, n_classes=41,
                 use_mfcc=False, n_folds=10, learning_rate=0.0001, 
                 max_epochs=50, n_mfcc=20):
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

def prepare_data(df, config, data_dir):
    X = np.empty(shape=(df.shape[0], config.dim[0], config.dim[1], 1))
    input_length = config.audio_length
    for i, fname in enumerate(df.index):
        print(fname)
        file_path = data_dir + fname
        data, _ = librosa.core.load(file_path, sr=config.sampling_rate, res_type="kaiser_fast")

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

        data = librosa.feature.mfcc(data, sr=config.sampling_rate, n_mfcc=config.n_mfcc)
        data = np.expand_dims(data, axis=-1)
        X[i,] = data
    return X



def prepare_data_log_specgrams(df, config, data_dir):
    #X = np.empty(shape=(9473, config.dim[0], config.dim[1], 1))
    input_length = config.audio_length
    log_specgrams = []
    for i, fname in enumerate(df.index):
        print(fname)
        file_path = data_dir + fname
        data, _ = librosa.core.load(file_path, sr=config.sampling_rate, res_type="kaiser_fast")
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
            
        #data = librosa.feature.mfcc(data, sr=config.sampling_rate, n_mfcc=config.n_mfcc)
        #data = np.expand_dims(data, axis=-1)
        melspec = librosa.feature.melspectrogram(data, n_mels = 60)
#       log_specgrams.append(melspec)       
        logspec = librosa.amplitude_to_db(melspec)
        #logspec = logspec.T.flatten()[:, np.newaxis].T
        log_specgrams.append(logspec)
        
    log_specgrams = np.asarray(log_specgrams).reshape(len(log_specgrams),bands,173,1) # nrow,60,41,1    
    return log_specgrams


def get_2d_conv_model(config):
    
    nclass = config.n_classes
    inp = Input(shape=(config.dim[0],config.dim[1],1))
    #inp = Input(shape=(config.dim[0],config.dim[1],2))   # turn this one on if its a tensor data. ie. 3 channels
    x = Convolution2D(32, (4,10), padding="same")(inp)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPool2D()(x)
    x = Dropout(rate=0.2)(x)
    
    x = Convolution2D(32, (4,10), padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPool2D()(x)
    x = Dropout(rate=0.2)(x)
    
    x = Convolution2D(32, (4,10), padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPool2D()(x)
    x = Dropout(rate=0.2)(x)
    
    x = Convolution2D(32, (4,10), padding="same")(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = MaxPool2D()(x)
    x = Dropout(rate=0.2)(x)
    
    x = Flatten()(x)
    x = Dense(64)(x)
    x = Dropout(rate=0.2)(x)
    x = BatchNormalization()(x)
    x = Activation("relu")(x)
    x = Dropout(rate=0.2)(x)
    
    out = Dense(nclass, activation=softmax)(x)

    model = models.Model(inputs=inp, outputs=out)
    opt = optimizers.Adam(0.01)

    model.compile(optimizer=opt, loss=losses.categorical_crossentropy, metrics=['acc'])
    return model

config = Config(sampling_rate=33000, audio_duration=4, n_folds=10,    #10
            learning_rate=0.005, use_mfcc=True, n_mfcc=50
            ,max_epochs = 50)  #100

''' 
# Another alternative of a 3 channel model (tensor input)

def build_model():
    
    model = Sequential()
    # input: 60x41 data frames with 2 channels => (60,41,2) tensors

    # filters of size 1x1 
    f_size = 1

    # first layer has 48 convolution filters 
    model.add(Convolution2D(48, f_size, strides=f_size, kernel_initializer='normal', padding='same', input_shape=(bands, frames, num_channels)))
    model.add(Convolution2D(48, f_size, strides=f_size, kernel_initializer='normal', padding='same'))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.5))

    # next layer has 96 convolution filters
    model.add(Convolution2D(96, f_size, strides=f_size, kernel_initializer='normal', padding='same'))
    model.add(Convolution2D(96, f_size, strides=f_size, kernel_initializer='normal', padding='same'))
    model.add(Activation('relu'))
    model.add(MaxPooling2D(pool_size=(2, 2)))
    model.add(Dropout(0.5))

    # flatten output into a single dimension 
    # Keras will do shape inference automatically
    model.add(Flatten())

    # then a fully connected NN layer
    model.add(Dense(256))
    model.add(Activation('relu'))
    model.add(Dropout(0.5))

    # finally, an output layer with one node per class
    model.add(Dense(num_labels))
    model.add(Activation('softmax'))

    # use the Adam optimiser
    adam = Adam(lr=0.001, beta_1=0.9, beta_2=0.999, epsilon=1e-08, decay=0)
    model.compile(loss='categorical_crossentropy', metrics=['accuracy'], optimizer=adam)
    
    return model
'''

################################
# Data prep
################################
SAMPLE_RATE = 33000
train = pd.read_csv(os.path.join(INIT_PATH, 'train.csv'))
test = pd.read_csv(os.path.join(INIT_PATH, 'sample_submission.csv'))
bands = 60


LABELS = list(train.label.unique())
label_idx = {label: i for i, label in enumerate(LABELS)}
train.set_index("fname", inplace=True)
test.set_index("fname", inplace=True)
train["label_idx"] = train.label.apply(lambda x: label_idx[x])

################################
#  Feature extraction - MFCC and Log-spectogram
################################
# MFCC
X_train = prepare_data(train, config, 'data\\audio_train\\')
X_test = prepare_data(test, config, 'data\\audio_test\\')
y_train = to_categorical(train.label_idx, num_classes=config.n_classes)

# Log of spectogram
#X_train = prepare_data_log_specgrams(train, config, 'data\\audio_train\\')
#X_test = prepare_data_log_specgrams(test, config, 'data\\audio_test\\')
#y_train = to_categorical(train.label_idx, num_classes=config.n_classes)

# Special 3rd dimension to incorporate?
# https://librosa.github.io/librosa/generated/librosa.feature.delta.html
#X_train = np.concatenate((X_train, np.zeros(np.shape(X_train))), axis = 3)
#for i in range(len(X_train)):
#    X_train[i, :, :, 1] = librosa.feature.delta(X_train[i, :, :, 0])
#
#X_test = np.concatenate((X_test, np.zeros(np.shape(X_test))), axis = 3)
#for i in range(len(X_test)):
#    X_test[i, :, :, 1] = librosa.feature.delta(X_test[i, :, :, 0])

    
# Normalization as per the standard NN process
mean = np.mean(X_train, axis=0)
std = np.std(X_train, axis=0)

X_train = (X_train - mean)/std
X_test = (X_test - mean)/std
    
################################
# Training 2D Conv in 10-fold CV
################################
PREDICTION_FOLDER = "2D CNN MFCC and logSpectogram"
if not os.path.exists(PREDICTION_FOLDER):
    os.mkdir(PREDICTION_FOLDER)
if os.path.exists('logs/' + PREDICTION_FOLDER):
    shutil.rmtree('logs/' + PREDICTION_FOLDER)


start = datetime.datetime.now(timezone('Australia/Sydney')).strftime("%I:%M:%S %p")

skf = StratifiedKFold(train.label_idx, n_folds=config.n_folds)
for i, (train_split, val_split) in enumerate(skf):
    K.clear_session()


    X, y, X_val, y_val = X_train[train_split], y_train[train_split], X_train[val_split], y_train[val_split]
    

    checkpoint = ModelCheckpoint('2D CNN MFCC and logSpectogram\\best_%d.h5'%i, monitor='val_loss', verbose=1) #, save_best_only=True)
    
    #reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2,
    #                          patience=5, min_lr=0.001)
    
    #early = EarlyStopping(monitor="val_loss", mode="min", patience=5)
    tb = TensorBoard(log_dir='./logs/' + PREDICTION_FOLDER + '/fold_%i'%i, write_graph=True)
    callbacks_list = [checkpoint, tb]  # early, reduce_lr
    #print("#"*50)
    #print("#"*100)
    print("Fold: ", i)
    model = get_2d_conv_model(config)
    history = model.fit(X, y, validation_data=(X_val, y_val), callbacks=callbacks_list, 
                        batch_size=64, epochs=config.max_epochs)
    model.load_weights('2D CNN MFCC and logSpectogram\\best_%d.h5'%i)

    # Save train predictions
    predictions = model.predict(X_train, batch_size=64, verbose=1)
    np.save(PREDICTION_FOLDER + "/train_predictions_%d.npy"%i, predictions)

    # Save test predictions
    predictions = model.predict(X_test, batch_size=64, verbose=1)
    np.save(PREDICTION_FOLDER + "/test_predictions_%d.npy"%i, predictions)

    # Make a submission file
    top_3 = np.array(LABELS)[np.argsort(-predictions, axis=1)[:, :3]]
    predicted_labels = [' '.join(list(x)) for x in top_3]
    test['label'] = predicted_labels
    test[['label']].to_csv(PREDICTION_FOLDER + "/predictions_%d.csv"%i)
    
    
end = datetime.datetime.now(timezone('Australia/Sydney')).strftime("%I:%M:%S %p")
print(start, '<--->', end)

#################################
# Ensemble the 10-fold Predictions
#################################
pred_list = []
for i in range(10):
    pred_list.append(np.load("2D CNN MFCC and logSpectogram\\test_predictions_%d.npy"%i))
prediction = np.ones_like(pred_list[0])
for pred in pred_list:
    prediction = prediction*pred
prediction = prediction**(1./len(pred_list))
# Make a submission file
top_3 = np.array(LABELS)[np.argsort(-prediction, axis=1)[:, :3]]
predicted_labels = [' '.join(list(x)) for x in top_3]


test = pd.read_csv('data\\sample_submission.csv')
test['label'] = predicted_labels
test[['fname', 'label']].to_csv("submissions\\Submission 2D CNN MFCC.csv", index=False)


    
    
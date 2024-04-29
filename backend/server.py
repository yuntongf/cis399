from flask import Flask
from flask_cors import CORS
from flask import request

## Packages
import matplotlib.pyplot as plt
import numpy as np
import json

from scipy import signal
from scipy.signal import chirp

import sounddevice as sd
import matplotlib.pyplot as plt

# pip install flask flask-cors matplotlib scipy sounddevice flask-socketio 
# flask --app server run

app = Flask(__name__)
CORS(app)

def butter_lowpass(cutoff, fs, order=5):
    nyq = 0.5 * fs
    normalCutoff = cutoff / nyq
    b, a = signal.butter(order, normalCutoff, btype='low')
    return b, a

def butter_lowpass_filter(data, cutoff, fs, order=5):
    b, a = butter_lowpass(cutoff, fs, order=order)
    y = signal.lfilter(b, a, data)
    return y

def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = signal.butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandpass(lowcut, highcut, fs, order=order)
    y = signal.lfilter(b, a, data)
    return y

def smooth_the_sound(tx):
    win_len = 60
    hn_win = np.hanning(win_len)
    padding = np.ones((len(tx) - win_len,))
    hn_win = np.concatenate((hn_win[:win_len//2], padding, hn_win[win_len//2:]))
    return tx * hn_win

def play_and_record(freq,sample_rate,duration,sd):    
    sd.default.channels   = 1
    sd.default.samplerate = sample_rate
    
    #TODO implement this function (hint: use np.linspace for t)
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    x = np.sin(2 * np.pi * freq * t)
    x = smooth_the_sound(x)
    y = sd.playrec(x)
    
    return y

def get_median_index(idx):
    # use global values
    return idx + window_range_start - median_peak_location

def idx_to_distance(idx):
    #TODO implement the equation above
    delta_f = idx * (sample_rate/window_length)
    slope = (freq_high - freq_low) / chirp_length     # Hz/s
    distance = (delta_f / slope) * 343 / 2   # remember to divide by 2 for the round-trip distance
    
    return distance

# Returns the moving average of the input signal
def moving_average(x, w):
    return np.convolve(x, np.ones(w), 'valid') / w

# like argmax, but returns the mean of the largest n values
def get_largest_n_mean(array, n):
    return np.mean(np.argpartition(array, -n)[-n:])

def background_subtract(all_multiplied_ffts):
    #TODO: For each chirp, subtract the background signal and store them in "after_subtraction" variable
    # The background signal is the mean values of all the chirps.
    background = np.mean(all_multiplied_ffts, axis = 0)
    after_subtraction = all_multiplied_ffts - background

    return after_subtraction 

def play_and_record_chirp(freq_low,freq_high,sample_rate,chirp_duration,total_duration,sd):

    sd.default.channels   = 1
    sd.default.samplerate = sample_rate
    
    #TODO implement this function
    t = np.linspace(0, chirp_duration, int(sample_rate * chirp_duration), endpoint=False)
    chirp_signal = chirp(t, f0=freq_low, f1=freq_high, t1=chirp_duration, method='linear') # a single chirp
    chirp_signal = smooth_the_sound(chirp_signal)
    
    num_chirp = int(total_duration / chirp_duration)
    tx = np.tile(chirp_signal, num_chirp)        # repeat for multiple chirps
    rx = sd.playrec(tx)

    return tx, rx

# Gloabl variables
global tx, rx
sample_rate = 48000
freq_low    = 17000
freq_high   = 23000
chirp_length   = 0.05
total_duration = 10
lowpass_cutoff = 5000 

# JSON encoder
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

@app.route("/play", methods = ['POST'])
def play_record_chirp():
    global total_duration, tx, rx
    print(request.json)
    total_duration = request.json['duration']
    # play sound
    tx, rx = play_and_record_chirp(freq_low,freq_high,sample_rate,chirp_length,total_duration,sd)

    return {'status': 200}

@app.route("/analyze")
def analyze_chirp():
    # mix the signal
    rx_all = rx.squeeze()
    sample_in_chirp = int(chirp_length * sample_rate)
    mixed = np.multiply(rx_all, tx).reshape(-1, sample_in_chirp)
    mixed = np.apply_along_axis(lambda x: butter_lowpass_filter(x, lowpass_cutoff, sample_rate), 1, mixed)

    mixed_sub = background_subtract(mixed)             # background subtraction of mixed
    mixed_sub_fft = np.apply_along_axis(np.fft.rfft, 1, mixed_sub)
    mixed_sub_fft_abs = np.abs(mixed_sub_fft)     # the amplitude (abs) of the fft result
    mixed_sub_fft_phase = np.angle(mixed_sub_fft)   # the phase of the fft result

    mixed_sub_peak_inds = np.apply_along_axis(np.argmax, 1, mixed_sub_fft_abs)
    print('after subtraction peak ind: \n', mixed_sub_peak_inds)
    print(f'mean {np.mean(mixed_sub_peak_inds)}, median: {np.median(mixed_sub_peak_inds)}')

    # show the breathing pattern
    range_bin = 17
    unwrap_phase = np.unwrap(mixed_sub_fft_phase[:, range_bin])

    json_dump = json.dumps(unwrap_phase, cls=NumpyEncoder)
    print('json dump is: ', json_dump)

    return json_dump

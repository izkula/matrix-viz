import numpy as np
import sys

if(len(sys.argv) > 1):
    outfile = sys.argv[1]
else:
    outfile = 'UDV_1.02.npz'

npzfile = np.load(outfile)
print npzfile.files

V = npzfile['V']
D = npzfile['D']
U = npzfile['U']
print U, np.shape(U)
print D, np.shape(D)
print V, np.shape(V)
print np.sort(V[:,1]**2)
print np.sort(V[:,2]**2)


import numpy as np
import sys
import matplotlib.pyplot as plt
import scipy.spatial.distance as dst
import scipy.cluster.hierarchy as hrc
import pylab

def LoadData():
    if(len(sys.argv) > 1):
        outfile = sys.argv[1]
    else:
        #outfile = 'UDV_1.02.npz'
        outfile = 'factors.npz'


        npzfile = np.load(outfile)
        print npzfile.files

        A = npzfile['U']
        print "A", np.shape(A)
        u, s, v = np.linalg.svd(A, full_matrices=0)
        print "v", v[:,1]

        #for i in range(np.shape(A)[1]):

            #A[:, i] = A[:,i]/np.mean(A[:, i])

    return A

# Divides the data into nwin overlapping subsets
# MAKE nwin odd
# and calculates the SVD on each subsets
# currently overlaps sets by 1/2
def WindowedSVD(data, nwin, overlap):
    nAllPoints = data.shape[0]
    if(overlap):
        nWindowPoints = 2*nAllPoints/(nwin + 1)
        windowDelay = nWindowPoints/2
    else:
        nWindowPoints = nAllPoints/(nwin)
        windowDelay = nWindowPoints

    At = []
    Ut = []
    St = []
    Vt = []

    for i in range(nwin):
        start = i*windowDelay
        end = start + nWindowPoints
        A = np.asarray(data[start:min(end, nAllPoints), :])
        print "start", start
        print "end", end


        u, s, v = np.linalg.svd(A, full_matrices=0)
        At.append(A)
        Ut.append(u)
        St.append(s)
        Vt.append(v)

    return [At, Ut, St, Vt]


def SortAndClusterBySVD(Ut, St, Vt):
    for t in range(len(Ut)):
        u = Ut[t]
        s = St[t]
        v = Vt[t]

        c = v**2 #coefficients
        #print "u", np.shape(u)
        #print "v", np.shape(v)
        cs_indices = np.argsort(c, axis=0)
        cs = np.sort(c, axis=0)
        end = np.shape(cs)[0] -1
        print np.sort(cs_indices[end, :])
        print np.sort(cs[end, :])

def HierarchicalCluster(A):
    #see http://stackoverflow.com/questions/2982929/plotting-results-of-hierarchical-clustering-ontop-of-a-matrix-of-data-in-python
    Corr = np.corrcoef(A.T)
    fig = plt.figure(figsize=(8,8))
    ax1 = fig.add_axes([0.09,0.1,0.2,0.6])
    Y = hrc.linkage(Corr, method='centroid')
    Z1 = hrc.dendrogram(Y, orientation='right')
    ax1.set_xticks([])
    ax1.set_yticks([])

    ax2 = fig.add_axes([0.3,0.71,0.6,0.2])
    Y = hrc.linkage(Corr, method='centroid')
    Z2 = hrc.dendrogram(Y)
    ax2.set_xticks([])
    ax2.set_yticks([])

    axmatrix = fig.add_axes([0.3,0.1,0.6,0.6])
    idx1 = Z1['leaves']
    idx2 = Z2['leaves']
    Corr = Corr[idx1, :]
    Corr = Corr[:, idx2]
    im = axmatrix.matshow(Corr, aspect='auto', origin='lower')

    axcolor = fig.add_axes([0.91,0.1,0.02,0.6])
    pylab.colorbar(im, cax=axcolor)
    fig.show()
    fig.savefig('dendrogram.png')

    #print Z1['leaves']

def CorrelationMatrix(A, t):
    print A
    Corr = np.corrcoef(A.T)
    for i in range(np.shape(Corr)[0]):
        Corr[i, i] = 0
    fig = plt.figure()
    ax = fig.add_axes([0.1, 0.1, 0.8, 0.8])
    fig = ax.matshow(Corr)
    plt.savefig(str(t) + '.png')
    #plt.matshow(A)

def CorrelationMatrices(At):
    for t in range(len(At)):
        fig = CorrelationMatrix(At[t], t)
    plt.show()

def Plot(A, start, end):
    fig = plt.figure()
    end = min(len(A[1,:]), end)
    for i in range(start, end+1):
        ax = plt.subplot(end-start, 1, i-start)
        plt.plot(A[:,i])
        plt.ylim([-0.3, 0.3])
        plt.xticks([])
        plt.yticks([])
            

        plt.yticks([-0.2, 0, 0.2])
    plt.xticks(np.arange(0, len(A), 100))
    fig.show()
    fig.savefig('timeseries' + str(start) + '_' + str(end) + '.png')

def Clean(A):
    Anew = []
    for i in range(np.shape(A)[1]):
        if np.abs(np.cov(A[:,i]))> 0.000001:
            print np.shape([A[:, i]])
            Anew.append(A[:, i])
    Anew = np.array(Anew)
    Anew = Anew.T
    print Anew
    print "Anew",np.shape(Anew)

    return Anew


if __name__ == "__main__":
    data = LoadData()
    data = Clean(data)
    [At, Ut, St, Vt] = WindowedSVD(data, 9, True);

    HierarchicalCluster(data)
    for i in range(1):
        HierarchicalCluster(At[i])
    #    Plot(data, 10*i, 10*(i+1))

    CorrelationMatrices(At)
  #  SortAndCluster(Ut, St, Vt)

   
   # TimeSeriesToCSV()

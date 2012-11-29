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
    A = npzfile['U']
    #for i in range(np.shape(A)[1]):
        #A[:, i] = A[:,i]/np.mean(A[:, i])
    return A

# Divides the data into nwin overlapping subsets
# MAKE nwin odd
# and calculates the SVD on each subsets
# currently overlaps sets by 1/2
def WindowedMatrices(data, nwin, overlap):
    nAllPoints = data.shape[0]
    if(overlap):
        nWindowPoints = 2*nAllPoints/(nwin + 1)
        windowDelay = nWindowPoints/2
    else:
        nWindowPoints = nAllPoints/(nwin)
        windowDelay = nWindowPoints

    At = []
    for i in range(nwin):
        start = i*windowDelay
        end = start + nWindowPoints
        A = np.asarray(data[start:min(end, nAllPoints), :])
        At.append(A)

    return At


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
    return Corr

def CorrelationMatrices(At):
    Ct = []
    for t in range(len(At)):
        C = CorrelationMatrix(At[t], t)
        Ct.append(C)
    return Ct


#- Plots all time series between indices start and end
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

#- Removes all time series with a covariance of 0
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


#def ClusterBySVD(A):
# Input: Matrix of Time Series
# Output: [ClusterLevel1, ClusterLevel2, ClusterLevel3]
# Where each ClusterLevel = [Matrix of Time Series for each cluster, matrix of relationships weights between clusters]

def FindMax(v, i=-1): #skips the i'th entry
    m = v[0]
    mj = 0
    if (i >= 0):
        for j in range(1, i):
            if v[j] > m:
                m = v[j]
                mj = j
        for j in range(i+1, len(v)):
            if v[j] > m:
                m = v[j]
                mj = j
    else:
        for j in range(1, len(v)):
            if v[j] > m:
                m = v[j]
                mj = j

    return [m, mj]

def ClusterByClosestNeighbor(closestNeighbors, lastClusterID):
    clusterIndices = [0]*len(closestNeighbors)
    clusterCount = 0
    for i in range(len(closestNeighbors)):
        if closestNeighbors[i] < i:
            clusterIndices[i] = clusterIndices[closestNeighbors[i]]
        else:
            clusterIndices[i] = clusterCount + lastClusterID
            clusterCount += 1

    return [clusterIndices, clusterCount]

def StackTimeSeries(AllClusters, lastClusterID, clusterCount):
    A = []
    for i in range(0, clusterCount):
        ts = AllClusters[str(lastClusterID+i)]['timeSeries']
        A.append(ts)

    A = np.array(A)
    A = A.T # so that it matches the initial data
    print np.shape(A)
    return A

# Returns a weight matrix holding the relationship between all clusters
def RelateAllClusters(AllClusters):
    A = StackTimeSeries(AllClusters, 0, len(AllClusters))
    W = np.corrcoef(A.T)
    plt.matshow(W)


#Make a relationship matrix by clustering
#input: matrix with time series as the columns (A[:, i])
def ClusterByCorrelation(A):
    clusterCount = np.shape(A)[1] 
    print "clusterCount should be ~600: ", clusterCount
    clustersPerLevel = [clusterCount]

    AllClusters = {} #Each entry is a Cluster dict
    
    for i in range(len(A[0, :])):
        AllClusters[str(i)] = {'members':[i], 'timeSeries': A[:, i], 'metric': 1, 'size': 1}

    W = np.corrcoef(A.T) #relationship weight matrix
    lastClusterID = len(A[0, :])

    while clusterCount > 1:
        closestNeighbors = []
        for i in range(len(W[0, :])):
            [m, mindex] = FindMax(W[:, i], i)
            closestNeighbors.append(mindex)

        [clusterIndices, clusterCount] = ClusterByClosestNeighbor(closestNeighbors, lastClusterID)
        #print "clusterIndices", clusterIndices
        clusterMembers = {}
        for i in range(clusterCount): #initialize
            clusterMembers[str(i+lastClusterID)] = []
        for i in range(len(clusterIndices)): #fill
            clusterMembers[str(clusterIndices[i])].append(i)

        #now add clusters to AllClusters
        for i in range(clusterCount):
            AllClusters[str(i+lastClusterID)] = {'members':clusterMembers[str(i+lastClusterID)]}
            #print AllClusters[str(i+lastClusterID)]
        #now calculate representative time series of each cluster
        plt.figure()
        for i in range(clusterCount):
            j = i + lastClusterID
            
            #use mean time series to combine the time series within a cluster
            members = AllClusters[str(j)]['members']
            print members
            sum = AllClusters[str(members[0])]['timeSeries']
            for k in range(1, len(members)):
                sum += AllClusters[str(members[k])]['timeSeries']
            mean = sum/len(members)
            AllClusters[str(j)]['timeSeries'] = mean
            if i < 5:
                ax = plt.subplot(5, 1, i+1)
                ax.plot(mean)
        

        clustersPerLevel.append(clusterCount)  

        #Recalculate data for next loop
        A = StackTimeSeries(AllClusters, lastClusterID, clusterCount)
        W = np.corrcoef(A.T)
        if (np.shape(W) != ()):
            plt.matshow(W)
        print np.shape(W)
        lastClusterID += clusterCount
        print "clustersPerLevel", clustersPerLevel


    return AllClusters

        # #For plotting a cluster
        # plt.figure()
        # j = 100 + clustersPerLevel[0]
        # for m in range(len(AllClusters[str(j)]['members'])):
        #     index = AllClusters[str(j)]['members'][m]
        #     print "index", index
        #     plt.subplot(4, 1, m)
        #     plt.plot(AllClusters[str(index)]['timeSeries'])
        # plt.figure()
        # plt.plot(AllClusters[str(j)]['timeSeries'])
        # 


    #while numClusters > 1:
        #pass through each column of matrix, determine index of highest (nondiagonal) relationship //this is kind of simplistic
        #include possibility of using a threshold here on the value of correlation that will link it with something other than itself
        #if below the threshold then just set self as the closest cluster
        #make a vector where each index is a neuron (or cluster), and each entry is the closest related neuron
        #setup a different cluster id vector (each entry says which cluster each index is in)
        #pass through the first vector, if the closest related neuron is in a cluster, join that cluster, if the closest
        # related neuron is later on in the iteration, then form a new cluster
        #now you have a vector identifying which cluster each neuron is in
        # convert this into a map with an array saying which neurons are in which cluster, and the mapkey starts counting
        # after the highest mapkey so far (initially, we have n mapkeys for every neuron) (then in the next level up each index 
        # is n+i)
        #now, for each cluster, calculate the mean time series based on the time series of its constituents, store this
        # possibly in the same map
        #also calculate the mean correlation of all components of a cluster
        #calculate the relationship between all of the time series' to form a new relationship matrix
        # numClusters = size of the relationship matrix
        # loop


#def ClusterByDirectedInformation(A):


#Implement clustering so that have 
# 1) nxn Matrix with n = number of clusters
# 2) Time series corresponding to each cluster

# Different types of matrices (depending on input call) - or do this all at the beginning?

#OUTPUT FORMAT TO JS

#Still need to think of a stationary graphic.




if __name__ == "__main__":
    data = LoadData()
    data = Clean(data)
    At = WindowedMatrices(data, 9, True);

    #HierarchicalCluster(At[0])
    AllClusters = ClusterByCorrelation(data)
    W = RelateAllClusters(AllClusters)
   # ClusterByCorrelation(At[1])
   # ClusterByCorrelation(At[2])

    plt.show()
   # HierarchicalCluster(data)
   # for i in range(9):
    #    HierarchicalCluster(At[i])
    #    Plot(data, 10*i, 10*(i+1))

    #CorrelationMatrices(At)
  #  SortAndCluster(Ut, St, Vt)
   # TimeSeriesToCSV()



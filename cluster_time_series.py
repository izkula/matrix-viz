import numpy as np
import sys
import matplotlib.pyplot as plt
import scipy.spatial.distance as dst
import scipy.cluster.hierarchy as hrc
import pylab
import json


#clusters contain: 'members', 'level', 'timeSeries'

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


#Given a vector with n entries, where n = the number of neurons (or clusters) at this level, corresponding
# to the index of the most closely related neuron (or cluster)
# This groups them sequentially. Starting at the beginning, if the closest neighbor
# has already been assigned to a cluster, then that neuron joins that cluster, and if
# not, then it forms a new cluster.
# Returns clusterIndices: vector of length n where each entry is the cluster to which that neuron belongs
# and clusterCount = the number of clusters
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
    return W

# Starts at the topmost cluster, and traverses down the hierarchy, labeling the 'parent' of each cluster
def GetClusterParents(AllClusters):
    for i in range(len(AllClusters)-1, -1, -1):
        cluster = AllClusters[str(i)]
        if (i == range(len(AllClusters) - 1)):
            AllClusters[str(i)]['parent'] = i
        children = cluster['members']
        print "children", children
        for j in range(len(children)):
            if i != j:
                AllClusters[str(children[j])]['parent'] = i


def GetSize(AllClusters, members):
    size = 0
    for i in range(len(members)):
        size += AllClusters[str(members[i])]['size']
    return size

#Make a relationship matrix by clustering
#input: matrix with time series as the columns (A[:, i])
def ClusterByCorrelation(A):
    clusterCount = np.shape(A)[1] 
    print "clusterCount should be ~600: ", clusterCount
    clustersPerLevel = [clusterCount]

    AllClusters = {} #Each entry is a Cluster dict
    
    for i in range(len(A[0, :])):
        AllClusters[str(i)] = {'members':[i], 'timeSeries': A[:, i], 'metric': 1, 'size': 1, 'level':0, 'parent':-1}

    W = np.corrcoef(A.T) #relationship weight matrix
    lastClusterID = len(A[0, :])
    level = 0

    while clusterCount > 1:
        level += 1
        closestNeighbors = []
        for i in range(len(W[0, :])):
            [m, mindex] = FindMax(W[:, i], i)
            closestNeighbors.append(mindex)

        [clusterIndices, clusterCount] = ClusterByClosestNeighbor(closestNeighbors, lastClusterID)
        if level > 8:
            print "clusterIndices", clusterIndices
        clusterMembers = {}
        for i in range(clusterCount): #initialize an array for each of the new clusters
            clusterMembers[str(i+lastClusterID)] = []
        for i in range(len(clusterIndices)): #fill
            #clusterMembers[str(clusterIndices[i])].append(i)
            clusterMembers[str(clusterIndices[i])].append(i + lastClusterID - len(clusterIndices))
#####YOU JUST CHANGED THE LINE ABOVE THIS on Thursday 11/29 at 8:05pm

        #now add clusters to AllClusters
        for i in range(clusterCount):
            csize = GetSize(AllClusters, clusterMembers[str(i+lastClusterID)])
            AllClusters[str(i+lastClusterID)] = {'members':clusterMembers[str(i+lastClusterID)], 
                                                 #'size':len(clusterMembers[str(i+lastClusterID)]),
                                                 'size': csize,
                                                 'level': level, 'parent': -1}

            #print AllClusters[str(i+lastClusterID)]
        #now calculate representative time series of each cluster
        #plt.figure()

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
            #if i < 5:
                #ax = plt.subplot(5, 1, i+1)
                #ax.plot(mean)
        

        clustersPerLevel.append(clusterCount)  

        #Recalculate data for next loop
        A = StackTimeSeries(AllClusters, lastClusterID, clusterCount)
        W = np.corrcoef(A.T)
        #if (np.shape(W) != ()):
            #plt.matshow(W)
        print np.shape(W)
        lastClusterID += clusterCount
        print "clustersPerLevel", clustersPerLevel

        #GetClusterParents(AllClusters)
        ## Get Cluster Parents
    for i in range(len(AllClusters)-1, -1, -1):
        print i
        cluster = AllClusters[str(i)]
        if (i == range(len(AllClusters) - 1)):
            AllClusters[str(i)]['parent'] = i
        children = cluster['members']
        print "children", children
        for j in range(len(children)):
            if i != j: # or AllClusters[str(children[j])]['parent'] == -1:
                if AllClusters[str(children[j])]['parent'] == -1:
                    AllClusters[str(children[j])]['parent'] = i
        #print AllClusters

    return [AllClusters, clustersPerLevel]

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

def PlotClusteredMatrix(clusters, filename, start=0, end=-1):
    if end == -1:
        end = len(clusters) - 1


    indices = []
    for i in range(start, end):
        cluster = clusters[str(i)]
        members = cluster['members']
        for j in range(len(members)):
            indices.append(members[j])
    TS = StackTimeSeries(clusters, 0, len(clusters))

    Aordered = []
    for i in range(len(indices)):
        ts = TS[:, i]
        Aordered.append(ts)

    Aordered = np.array(Aordered)
    Aordered = Aordered.T
    W = np.corrcoef(Aordered.T)
    fig = plt.matshow(W)
    plt.savefig("Plots/Ordered_" + filename + ".png")



def PlotClusters(AtClusters, level):
    for i in range(len(AtClusters)):
        clusters = AtClusters[i]['clusters']
        levels = AtClusters[i]['levels']
        W = AtClusters[i]['W']
        print "W", np.shape(W)

        print "levels", levels
        if level > 0:
            minIndex = np.sum(levels[0:level])
        else:
            minIndex = 0
        maxIndex = minIndex + levels[level]

        print "minIndex", minIndex
        print "maxIndex", maxIndex
        w = W[minIndex:maxIndex, minIndex:maxIndex]
        fig = plt.matshow(w)
        plt.savefig("Time_" + str(i) + "_level_" + str(level) + ".png")


def  ToNodeLinkJSON(clusterInfo, threshold):
    clusters = clusterInfo['clusters']
    W = clusterInfo['W']
    levels = clusterInfo['levels']

    nodes = []
    links = []
    indexToName = {}
    counter = 0
    for i in range(len(W)):
        if clusters[str(i)]['level'] > -1: #Change this value (and two values below) to control how many levels of clustering get passed 
            nodes.append({'name': i, 'group':clusters[str(i)]['level'], 'children':clusters[str(i)]['members'], 
                'parent':clusters[str(i)]['parent'], 'size':clusters[str(i)]['size']})
            indexToName[str(i)] = counter
            counter += 1
    for i in range(len(W)):
        if clusters[str(i)]['level'] > -1:
            for j in range(i):
                if W[i][j] > threshold and clusters[str(j)]['level'] > -1:
#                    links.append({'source':i, 'target':j, 'value':int(W[i][j]*100)})
                    links.append({'source':indexToName[str(i)], 'target':indexToName[str(j)], 'value':int(W[i][j]*100)})


    fp = open('nodelinks.json', 'w')
    data = json.dumps(nodes)
    fp.write('{ "nodes":')
    fp.write(data)
    fp.write(', "links":')
    data = json.dumps(links)
    fp.write(data)
    fp.write('}')
    fp.close()





if __name__ == "__main__":
    data = LoadData()
    data = Clean(data)
    numWin = 9
    At = WindowedMatrices(data, numWin, True);

    AtClusters = []
    Wt = []
    #HierarchicalCluster(At[0])
    for i in range(numWin):
        [clusters, clustersPerLevel] = ClusterByCorrelation(At[i])
        print "i", i
        W = RelateAllClusters(clusters)
        clusterInfo = {'clusters': clusters, 'levels': clustersPerLevel, 'W': W}
        filename = str(i) + "_level_2"
        start = np.sum(clustersPerLevel[0:2])
        end = np.sum(clustersPerLevel[0:3])
        print "start", start, "end", end
        PlotClusteredMatrix(clusterInfo['clusters'], filename, start, end)
        AtClusters.append(clusterInfo)
    #PlotClusters(AtClusters, 2)


    ToNodeLinkJSON(AtClusters[0], 0.4)

   # ClusterByCorrelation(At[1])
   # ClusterByCorrelation(At[2])

    #plt.show()
   # HierarchicalCluster(data)
   # for i in range(9):
    #    HierarchicalCluster(At[i])
    #    Plot(data, 10*i, 10*(i+1))

    #CorrelationMatrices(At)
  #  SortAndCluster(Ut, St, Vt)
   # TimeSeriesToCSV()



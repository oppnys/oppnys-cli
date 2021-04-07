'use strict';

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

function getNpmInfo(packageName, registry = getDefaultRegistry()) {
    if (!packageName) return null
    const url = urlJoin(registry, packageName)
    return axios.get(url).then(resp => {
        if (resp.status) {
            return resp
        }
        return null
    }).catch(error => {
        return Promise.reject(error)
    })
}

async function getNpmVersions(packageName, registry) {
    const data = await getNpmInfo(packageName, registry)
    if (data) {
        const versions = Object.keys(data.data.versions)
        return versions
    }
    return []
}

function getSemverVersions(baseVersion, versions) {
    return versions
        .filter(version => semver.satisfies(version, `^${baseVersion}`))
        .sort((a, b) => semver.gt(b, a))
}

async function getNpmSemverVersion(packageName, baseVersion, registry) {
    const versions = await getNpmVersions(packageName, registry)
    const npmVersions = getSemverVersions(baseVersion, versions)
    if(npmVersions && npmVersions.length >= 0){
        return npmVersions[0]
    }
    return null
}

function getDefaultRegistry(isOrigin = false) {
    return isOrigin ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org/'
}

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getSemverVersions,
    getNpmSemverVersion
}

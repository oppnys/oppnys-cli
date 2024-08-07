const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(b, a));
}

function getDefaultRegistry(isOrigin = true) {
  return isOrigin ? 'https://registry.npmjs.org' : 'https://registry.npmmirror.com';
}

function getNpmInfo(packageName, registry = getDefaultRegistry(false)) {
  if (!packageName) return null;
  const url = urlJoin(registry, packageName);
  return axios.get(url)
    .then((resp) => {
      if (resp.status) {
        return resp;
      }
      return null;
    })
    .catch((error) => Promise.reject(error));
}

async function getNpmVersions(packageName, registry) {
  const data = await getNpmInfo(packageName, registry);
  if (data) {
    return Object.keys(data.data.versions);
  }
  return [];
}

async function getNpmSemverVersion(packageName, baseVersion, registry) {
  const versions = await getNpmVersions(packageName, registry);
  const npmVersions = getSemverVersions(baseVersion, versions);
  if (npmVersions && npmVersions.length >= 0) {
    return npmVersions[0];
  }
  return null;
}

async function getNpmLatestVersion(npmName = '', registry) {
  const versions = await getNpmVersions(npmName, registry);
  if (versions) {
    //  versions.length - 1
    return versions.sort((a, b) => semver.gt(a, b))[versions.length - 1];
  }
  return null;
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getSemverVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion,
};

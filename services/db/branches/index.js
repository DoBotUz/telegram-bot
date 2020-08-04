const dbService = require('..');

function getSampleBranch(org_id) {
  return dbService('branch').where({
    organization_id: org_id
  }).first()
}

module.exports = {
  getSampleBranch,
}
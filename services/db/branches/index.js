const dbService = require('..');

function getSampleBranch(org_id) {
  return dbService('branch').where({
    organizationId: org_id
  }).first()
}

module.exports = {
  getSampleBranch,
}
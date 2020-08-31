const dbService = require('..');
const { isBetween } = require('../../../common/utils');

function getSampleBranch(org_id) {
  return dbService('branch').where({
    organizationId: org_id
  }).first()
}

function isBranchOpen(branch_id) {
  return dbService('branch')
    .where({ id: branch_id })
    .first()
    .then(branch => {
      try {
        let timetable = JSON.parse(branch.timetable);
        return isBetween(new Date(), timetable.from, timetable.to);
      } catch(err) {
        return false;
      }
    });
}

module.exports = {
  getSampleBranch,
  isBranchOpen,
}
var exec = require('child_process').exec,
  Futures = require('futures'),
  pload = Futures.promise(),
  pdisk = Futures.promise(),
  pusage = Futures.promise();

function log() {
  console.log("event happened");
  console.dir(arguments);
}

exec('uptime', pload.fulfill);
exec('df -l -k |grep /dev/ |awk \'{print $3,$4}\'', pdisk.fulfill);
// sudo apt-get install vnstat && sudo vnstat -u -i eth0 && sudo /etc/init.d/vnstat start
exec('vnstat --dumpdb |grep "m;0"', pusage.fulfill);

pload.when(log);
pdisk.when(log);
pusage.when(log);

function parseLoad(err, stdout, stderr) {
    var load = stdout.split('load average:');
    load = load[1].split(', ');
    return load; 
}

function parseDisk(err, stdout, stderr) {
    return stdout;
}

function parseUsage(err, stdout, stderr) {
    return stdout.split(';');
}

Futures.join(pload, pdisk, pusage).when(function(loadArgs, diskArgs, usageArgs) {
    var result = [
      parseLoad.apply(null, loadArgs),
      parseDisk.apply(null, diskArgs),
      parseUsage.apply(null, usageArgs)
    ];
    console.log("\n\nall complete");
    console.dir(result);
});

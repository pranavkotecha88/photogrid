module.exports = function(express, app, formidable, fs, os){
  var router = express.Router();

  router.get('/', function(req, res, next){
    res.render('index', {host:app.get('host')});
  });

  router.post('/upload', function(req, res, next){

    function generateFileName(fileName) {
      var ext_regex = /(?:\.([^.]+))?$/;
      var ext = ext_regex.exec(fileName)[1];
      var date = new Date().getTime();
      var charBank = "abcdefghijklmnopqrstuvwxyz";
      var fstring = '';
      for (var i=0; i<15; i++) {
        fstring += charBank[parseInt(Math.random()*26)];
      }
      return (fstring += date + '.' + ext);
    }

    var tmpFile, nFile, fName;
    var newForm = new formidable.IncomingForm();
        newForm.keepExtensions = true;
        newForm.parse(req, function(err, fields, files){
          tmpFile = files.upload.path;
          fName = generateFileName(files.upload.name);
          nFile = os.tmpDir() + '/' + fName;
          res.writeHead(200, {'Content-type':'text/plain'});
          res.end();
        })

        newForm.on('end', function(){
          fs.rename(tmpFile, nFile, function(){

          })
        })
  })

  app.use('/', router);

}

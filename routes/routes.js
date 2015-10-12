module.exports = function(express, app, formidable, fs, os, gm, knoxClient, mongoose, io){

  var Socket;

  io.on('connection', function(socket){
    Socket = socket;
  })

  var singleImage = new mongoose.Schema({
    fileName : String,
    votes: Number
  })

  var singleImageModel = mongoose.model('singleImage', singleImage);

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
            gm(nFile).resize(300).write(nFile, function(){
              fs.readFile(nFile, function(err, buf){
                var req = knoxClient.put(fName, {
                  'Content-Length': buf.length,
                  'Content-Type':'image/jpeg'
                })
                req.on('response', function(res){
                  if(res.statusCode == 200){
                    var newImage = new singleImageModel({
                      fileName: fName,
                      votes : 0
                    }).save();

                    Socket.emit('status', {'msg':'Saved !!', 'delay':3000});
                    Socket.emit('doUpdate', {});

                    fs.unlink(nFile, function(){
                      console.log('Local File Deleted !');
                    })
                  }
                })
                req.end(buf);
              })
            })
          })
        })
  })

  router.get('/getimages', function(req, res, next){
    singleImageModel.find({}, null, {sort:{votes:-1}}, function(err, result) {
      res.send(JSON.stringify(result));
    })
  })

  router.get('/voteup/:id', function(req, res, next){
    singleImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err, result){
      res.send(200, {votes:result.votes});
    })
  })

  app.use('/', router);

}

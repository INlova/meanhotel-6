var mongoose = require('mongoose');
var Hotel = mongoose.model('Hotel');

var runGeoQuery = function(req, res) {

  var lng = parseFloat(req.query.lng);
  var lat = parseFloat(req.query.lat);

  // A geoJSON point
  var point = {
    type: "Point",
    coordinates: [lng, lat]
  };

  var geoOptions = {
    spherical: true,
    maxDistance: 2000,
    num: 5
  };

  Hotel.geoNear(point, geoOptions, function(err, results, stats) {
    console.log('Geo results', results);
    console.log('Geo stats', stats);

    res.status(200).json(results);
  });

}

module.exports.hotelsGetAll = function(req, res) {


  console.log('GET the hotels');
  console.log(req.query);

  var offset = 0;
  var count = 5;
  var maxCount = 10;

  if (req.query && req.query.lat && req.query.lng) {
    runGeoQuery(req, res);
    return;
  }

  if (req.query && req.query.offset) {
    offset = parseInt(req.query.offset, 10);
  }

  if (req.query && req.query.count) {
    count = parseInt(req.query.count, 10);
  }

  if (isNaN(offset) || isNaN(count)) {
    res.status(400).json({
      "message": "Bad querystring supplied"
    });
    return;
  }

  if (count > maxCount) {
    res.status(400).json({"message" : "Count limit to " + maxCount });
    return;
  }

  Hotel
    .find()
    .skip(offset)
    .limit(count)
    .exec(function(err, hotels) {
      if(err) {
        console.log("Error finding hotels");
        res.status(500).json(err);
      }
      console.log("Found hotels", hotels.length);
      res
        .json(hotels);
    });

};

module.exports.hotelsGetOne = function(req, res) {
  var id = req.params.hotelId;
  console.log('GET hotelId', id);

  Hotel
    .findById(id)
    .exec(function(err, doc) {
      if(err) {
        console.log("Error finding hotel");
        res.status(500).json(err);
      }

      if(!doc) {
        res.status(404).json({"Not Found": "No hotel found"});
      }
      res
        .status(200)
        .json(doc);
    });

};

module.exports.hotelsAddOne = function(req, res) {

    Hotel.create({
        name: req.body.name,
        description: req.body.description,
        stars: +req.body.stars,
        services: _splitArray(req.body.services),
        photos: _splitArray(req.body.photos),
        currency: req.body.currency,
        location: {
            address: req.body.address,
            coordinates: [+req.body.lng, +req.body.lat]
        }
    }, function(err, hotel) {
        if(err) {
            console.log("Error creating hotel");
            res.status(400).json({"message": "Error in posting a new hotel"});
            return;
        }
        console.log("Posted a new hotel");
        res.status(201).json(hotel);
    })
};


function _splitArray(input) {
    var output;
    if (input && input.length >0) {
        output = input.split(";");
    } else {
        output = [];
    }

    return output;
}

module.exports.hotelsUpdateOne = function(req, res) {
    var hotelId = req.params.hotelId;
    console.log("PUT hotelId", hotelId);

    Hotel.findById(hotelId)
        .select("-reviews -rooms")
        .exec(function(err, doc) {
            var response = {
                status: 200,
                message: doc
            }
            if(err) {
                response.status = 500;
                response.message = err;
            }
            else if(!doc) {
                response.status = 404;
                response.message = {
                    "message" : "Hotel ID not found"
                }
            }

            if(response.status !== 200) {
                res.status(response.status).json(response.message);
            } else {
                doc.name= req.body.name;
                doc.description= req.body.description;
                doc.stars= +req.body.stars;
                doc.services= _splitArray(req.body.services);
                doc.photos= _splitArray(req.body.photos);
                doc.currency= req.body.currency;
                doc.location= {
                    address: req.body.address,
                    coordinates: [+req.body.lng, +req.body.lat]
                };

                doc.save(function(err, hotelUpdate) {
                    if(err) {
                        res.status(500).json(err);
                    } else {
                        res.status(204).json();
                    }
                })
            }
        });
};

module.exports.hotelsDeleteOne = function(req, res) {
    var hotelId = req.params.hotelId;
    Hotel.findByIdAndRemove(hotelId)
        .exec(function(err, hotel) {
           if(err) {
               res.status(404).send(err);
           } else {
               console.log("Hotel Deleted, id: ", hotelId);
               if(hotel){
                   res.status(204).json();
               } else {
                   res.status(404).json("No hotel found");
               }
           }
        });
}
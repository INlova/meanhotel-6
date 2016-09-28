angular.module('meanhotel').controller('HotelController', HotelController);

function HotelController($route, hotelDataFactory, $routeParams) {
  var vm = this;
  var id = $routeParams.id;
  vm.submitted = false;
  hotelDataFactory.hotelDisplay(id).then(function(response) {
    vm.hotel = response;
		vm.stars = _getStarsArray(response.stars);
  });
	function _getStarsArray(stars) {
		return new Array(stars);
	}

  vm.addReview = function() {
    var postData = {
      name: vm.name,
      rating: vm.rating,
      review: vm.review
    };

    if(vm.reviewForm.$valid) {
      hotelDataFactory.postReview(id, postData).then(function(response){
        if (response.status === 200) {
          $route.reload();
        }
      }).catch(function(err) {
        console.log(err);
      });
    } else {
      vm.isSubmitted = true;
    }
  }
}

var app = angular.module('TweetGlobe', ['ngResource', 'pubnub.angular.service']);

app.controller('TweetHud', function($scope, $resource, $timeout, $rootScope, $timeout, PubNub) {

	var TWEET_SAMPLE_SIZE = 50, // The nubmer of Tweet to display in the left-hand column
      TREND_POLL_INTERVAL = 100000; // Trend update time interval

  /**
   *  Initializes PubNub websocket connection
   */
  $scope.init = function () {
  	$scope.tweets = [];

		PubNub.init({
      subscribe_key: pubnubConfig.subscribe_key,
      ssl: location.protocol == 'https:'
    });

	 	PubNub.ngSubscribe({
      channel: pubnubConfig.channel
    });

	  $rootScope.$on(PubNub.ngMsgEv(pubnubConfig.channel), function(event, payload) {
      
      // Add tweet to this hud
	    addTweet(payload.message);

      // Add tweet to 3D globe
      TwtrGlobe.onTweet(payload.message);
	  });
    
	  getTrends();
  }

  /**
   * GET request trends every TREND_POLL_INTERVAL and sets them on binded model
   */
  function getTrends () {

    $scope.trendsResource = $resource('/trends');

    $scope.trendsResource.query( { }, function (res) {
      $scope.trends = res;
    });

    $timeout(function () {
    	getTrends();
    }, TREND_POLL_INTERVAL);
  }

  /**
   * Adds Tweet data to binded model
   */
  function addTweet (tweet) {

  	tweet.sentiment.state = getSentimentState(tweet.sentiment.score);

  	$scope.$apply(function () {
	  	$scope.tweets.unshift(tweet);
  	});

	  if ($scope.tweets.length > TWEET_SAMPLE_SIZE) {
	  	$scope.$apply(function () {
		  	$scope.tweets.pop();
	  	});
  	}

  	measureSentiment();
  }

  $scope.avgSentiment = (0).toFixed(2);
  var sentimentScoreTotal = 0;

  /**
   * Averages sentiment of the TWEET_SAMPLE_SIZE
   */
  function measureSentiment () {
    sentimentScoreTotal = 0;

    angular.forEach($scope.tweets, function(tweet, key) {
      sentimentScoreTotal = sentimentScoreTotal + tweet.sentiment.score;
    });

    $scope.avgSentiment = (Math.round((sentimentScoreTotal / TWEET_SAMPLE_SIZE) * 100) / 100).toFixed(2);
    $scope.sentimentState = getSentimentState($scope.avgSentiment);
  }

  /**
   *  Returns sentiment description for use as a CSS class
   */
	function getSentimentState (score) {
		
		var state = 'neutral';

  	if (score < 0 & score > -0.2) {
  		state = 'negative';
  	}
  	else if (score < -0.2 & score > -0.4) {
  		state = 'negative1';
  	}
  	else if (score < -0.4 & score > -0.6) {
  		state = 'negative2';
  	}
  	else if (score < -0.6 & score > -0.8) {
  		state = 'negative3';
  	}
  	else if (score < -0.8 & score > -1) {
  		state = 'negative4';
  	}
  	else if (score < -1 ) {
  		state = 'negative5';
  	}		
  	else if (score > 0 & score < 0.2) {
  		state = 'positive';
  	}
  	else if (score > 0.2 & score < 0.4) {
  		state = 'positive1';
  	}	
  	else if (score > 0.4 & score < 0.6) {
  		state = 'positive2';
  	}			
  	else if (score > 0.6 & score < 0.8) {
  		state = 'positive3';
  	}			
  	else if (score > 0.8 & score < 1) {
  		state = 'positive4';
  	}			
  	else if (score > 1 ) {
  		state = 'positive5';
  	}	
		return state;
	}

  /**
   * GET request to stop stream on the server
   */
  $scope.stop = function () {

    $scope.trendsResource = $resource('/stream/stop');

    $scope.trendsResource.query( { }, function (res) {
      
    });
  }

  /**
   * GET request to start stream on the server
   */
  $scope.start = function () {

    $scope.trendsResource = $resource('/stream/start');

    $scope.trendsResource.query( { }, function (res) {
      
    });
  }

  $scope.init();

});

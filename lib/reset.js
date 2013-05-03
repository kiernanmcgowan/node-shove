// reset.js
// normalizes any functionality that may get upset between
// server and client change
$(function() {
  // set the backbone library
  require('backbone').$ = $;
});

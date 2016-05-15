var sessionid = '';
var sessionrole = '';
var socket = io();

/* selector functions to interact with the HTML and server via socket.io */
$(document).ready(function() {
  // when user picks a role
  $("select").on("change", function() {
    sessionrole = $("select option:selected").text()
    socket.emit('loggedin', {"role": sessionrole});
    var sessiontext = "";
    if (sessionrole === "admin")
      sessiontext = " As an admin, you can create new post submissions and moderate posts by other admins, users and guests."
    else if (sessionrole === "user")
      sessiontext = " As a user, you can create new post submissions, see your submissions awaiting moderation and subscribe to published posts."
    else if (sessionrole === "guest")
      sessiontext = " As a guest viewer, you can create new post submissions and see published posts."
    // lock selection
    $("#user-role").html('<div><h4><span class="glyphicon glyphicon-lock" aria-hidden="true"></span> '+sessionrole+'<span style="font-size:12px;"> '+sessiontext+'</span>'+'</h4></div>')
  })
});

// on post submission
$('form').submit(function() {
  var jsonObject = {
    "role": sessionrole,
    "title": $('#title').val(),
    "post": $('#post').val()
  };

  socket.emit('on_blog_post', jsonObject);
  $('#title').val('');
  $('#post').val('');
  return false;
});

// on trying to subscribe to newly published posts
$("#subscribe_publish").click(function() {
  var jsonObject = {
    "role": sessionrole,
    "session": sessionid
  };

  socket.emit('subscribe_publish', jsonObject);
});

// on trying to subscribe to moderation dashboard
$("#subscribe_pending").click(function() {
  var jsonObject = {
    "role": sessionrole,
    "session": sessionid
  };
  socket.emit('subscribe_pending', jsonObject);
});

// on trying to approve a pending post inside the moderation dashboard
$("#approve_pending").click(function() {
  socket.emit('approve_pending', {"role": sessionrole});
});

// on successful approval of blog post (i.e. via admin role)
socket.on('blog_post_approved', function(response) {
  var id = response._id;
  var msg = response._source;
  var text = '{Title:' + msg.title + ', Post: ' + msg.post + '}';

  if ($("#" + id).length) {
    $('#' + id).remove();
  }

  // add the new post as a <li>
  var li = document.createElement('li');
  li.className = 'list-group-item';
  li.id = id;
  li.appendChild(document.createTextNode(text));

  // add a "disapprove" label
  var iDiv = document.createElement('span');
  iDiv.className = 'dashboard-post label label-warning';

  iDiv.appendChild(document.createTextNode('Moderate'));

  li.appendChild(iDiv);

  // try to move to pending, (i.e. only admin role can do this)
  $(iDiv).on('click', function() {
    var jsonObject = {
      "role": sessionrole,
      "id": id
    };
    socket.emit('move_to_pending', jsonObject);
  });

  $('#all_published_posts').append(li);
});

// on creation of a blog post (adding the post to the moderation board)
socket.on('blog_post_created', function(response) {
  var id = response._id;
  var msg = response._source;
  var text = '{Title:' + msg.title + ', Post: ' + msg.post + '}';

  if ($("#" + id).length) {
    $('#' + id).remove();
  }

  var li = document.createElement('li');
  li.className = 'list-group-item';
  li.id = id;
  li.appendChild(document.createTextNode(text));

  // add a "publish" action label
  var iDiv = document.createElement('span');
  iDiv.className = 'dashboard-post label label-success';
  iDiv.appendChild(document.createTextNode('Publish'));

  // add a "delete" action label
  var deleteDiv = document.createElement('span');
  deleteDiv.className = 'dashboard-post label label-danger';
  deleteDiv.appendChild(document.createTextNode('Delete'));


  li.appendChild(deleteDiv);
  li.appendChild(iDiv);

  // moves the post to publish board (only an admin role can do this)
  $(iDiv).on('click', function() {
    var jsonObject = {
      "role": sessionrole,
      "id": id
    };
    socket.emit('approve_pending', jsonObject);
  });

  // deletes the post (only an admin role can do this)
  $(deleteDiv).on('click', function() {
    var jsonObject = {
      "role": sessionrole,
      "id": id,
      "type": "pendingpost"
    };
    socket.emit('delete_post', jsonObject);
  });

  $('#all_posts').append(li);
});

// remove the post from UI on successful deletion
socket.on('blog_post_deleted', function(response) {
  var id = response._id;

  $('#' + id).remove();
});

// successful pending subscription event
socket.on('subscribe_pending', function() {
  $("#subscribe_pending").removeClass("btn-info").addClass("btn-success").html("<span class='glyphicon glyphicon-ok'></span> Subscribed to Pending Posts");
});

// broadcast pending subscribe count
socket.on('subscribe_pending_count', function(msg) {
  $('#pending_subcount').text(msg);
});

// successful publish subscription event
socket.on('subscribe_publish', function() {
  $("#subscribe_publish").removeClass("btn-info").addClass("btn-success").html("<span class='glyphicon glyphicon-ok'></span> Subscribed to Published Posts");
});

// broadcast publish subscribe count
socket.on('subscribe_publish_count', function(msg) {
  $('#publish_subcount').text(msg);
});

// broadcast failure in action as alerts
socket.on('failure', function(msg) {
  alert(msg);
});

// assigns a session id to this client,
// which is used for all further communications
// (like, can the client with session id x delete post y?)
socket.on('joined', function(msg) {
  sessionid = msg;
});

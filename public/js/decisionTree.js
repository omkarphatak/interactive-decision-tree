var treeData, windowWidth, sliderWidth, slideTime, branches;

$(document).ready(function (){

    $('#readDis').click(function (event) {
        event.preventDefault();
        $('.welcome').hide();
        $('.disclaimer').show();
    });

    $('#agree').change(function (event) {
        event.preventDefault();
        $('.disclaimer').hide();
        $('.begin').show();
    });

    $('#start').click(function (event) {
        event.preventDefault();
        $.post('private/backend.php', {'action':'log'}, function(data) {
            var resp = $.parseJSON(data);
            $.cookie('idt-user',resp.userid,{ expires: 365 });
        });
        $('.toggle').hide();
        windowWidth = $('#tree-window').show().outerWidth(false);
        sliderWidth = 0;
        slideTime = 300;
        var branches = [];
        var options = {};
        loadData($('#tree-window').attr('data-source'));
    });

	$('#tree-reset').click(function (event) {
        event.preventDefault();
        $('#tree-window').scrollTo( 0 + 'px', {
            axis:'x',
            duration: slideTime,
            easing:'easeInOutExpo',
            onAfter: function(){
                $('.tree-content-box:gt(0)').remove();
            } //onAfter
        }); //scrollTo
    }); //click

    $('div.decision-links a').click(function (event) {
        

    });
});

function debug(str) {
	$('#debug').append( str + '<br />' );
}

function loadData(id) {
	$.ajax({
		type: 'GET',
		url: 'xml/tree' + id + '.xml',
		dataType: 'xml',
		success: function( xml ){
			buildNodes( xml );
		}
	});
}

function TreeBranch() {
	this.id = '';
	this.content = '';
	this.forkIDs = [];
	this.forkLabels = [];
}

function buildNodes(xmlData) {
	var maxDepth = 0;
    branches = [];
	treeData = xmlData;
	$(xmlData).find('branch').each(
		function(){
			var branch = new TreeBranch();
			branch.id = $(this).attr('id');
			branch.content = $(this).find('content').text();
			$(this).find('fork').each(
				function(){
					branch.forkIDs.push( $(this).attr('target') );
					branch.forkLabels.push( $(this).text() );
				}
			);
			branches.push( branch );
			var branchDepthParts = branch.id.split('.');
			if( branchDepthParts.length > maxDepth ){
				maxDepth = branchDepthParts.length;
			}
        });
	sliderWidth = windowWidth * maxDepth;
	$('#tree-slider').width( sliderWidth );
	var resetText = $(xmlData).find('resetText').text();
	$('#tree-reset').html( resetText );
	showBranch( 1 );
}

function resetActionLinks(){
	$('.decision-links a').unbind( 'click' );
	$('a.back-link').unbind( 'click' );

	$('.decision-links a').click( function(e){
		if( !$(this).attr('href') ){
			showBranch( $(this).attr('id') );
		}
	});
	$('a.back-link').click( function(){
		$('#tree-window').scrollTo( '-=' + windowWidth + 'px', { axis:'x', duration:slideTime, easing:'easeInOutExpo' } );
		$(this).parent().fadeOut( slideTime, function(){
			$(this).remove();
		});
	});
}

function showBranch( id ){
    var currentBranch;
	for(var i = 0; i < branches.length; i++ ){
		if( branches[i].id == id ){
			currentBranch = branches[i];
			break;
		}
	}
	var decisionLinksHTML = '<div class="decision-links">';
	for(var d = 0; d < currentBranch.forkIDs.length; d++ ){
		var link = '';
		var forkContent = $(treeData).find('branch[id="' + currentBranch.forkIDs[d] + '"]').find('content').text();
		if( forkContent.indexOf('http://') == 0 || forkContent.indexOf('https://') == 0 ){
			link = 'href="' + forkContent + '"';
		}
		decisionLinksHTML += '<a ' + link + ' id="' + currentBranch.forkIDs[d] + '">' + currentBranch.forkLabels[d] + '</a>';
	}
	decisionLinksHTML += '</div>';
	var branchHTML = '<div id="branch-' + currentBranch.id + '" class="tree-content-box"><div class="content">' + currentBranch.content + '</div>' + decisionLinksHTML;
	if( currentBranch.id !== 1 ){
		branchHTML += '<a class="back-link">&laquo; Back</a>';
	}
	branchHTML += '</div>';
	$('#tree-slider').append( branchHTML );
	resetActionLinks();
	if(currentBranch.id != 1 ){
		$('#tree-window').scrollTo( '+=' + windowWidth + 'px', { axis:'x', duration:slideTime, easing:'easeInOutExpo' } );
	}
	// add last-child class for IE
	$('.decision-links a:last').addClass( 'last-child' );
}


/*
Useful timer functions used for menu mouseout delays
Source: http://www.codingforums.com/showthread.php?t=10531
*/
function Timer(){
    this.obj = (arguments.length)?arguments[0]:window;
    return this;
}

// The set functions should be called with:
// - The name of the object method (as a string) (required)
// - The millisecond delay (required)
// - Any number of extra arguments, which will all be
//   passed to the method when it is evaluated.

Timer.prototype.setInterval = function(func, msec){
    var i = Timer.getNew();
    var t = Timer.buildCall(this.obj, i, arguments);
    Timer.set[i].timer = window.setInterval(t,msec);
    return i;
}
Timer.prototype.setTimeout = function(func, msec){
    var i = Timer.getNew();
    Timer.buildCall(this.obj, i, arguments);
    Timer.set[i].timer = window.setTimeout("Timer.callOnce("+i+");",msec);
    return i;
}

// The clear functions should be called with
// the return value from the equivalent set function.

Timer.prototype.clearInterval = function(i){
    if(!Timer.set[i]) return;
    window.clearInterval(Timer.set[i].timer);
    Timer.set[i] = null;
}
Timer.prototype.clearTimeout = function(i){
    if(!Timer.set[i]) return;
    window.clearTimeout(Timer.set[i].timer);
    Timer.set[i] = null;
}

// Private data

Timer.set = new Array();
Timer.buildCall = function(obj, i, args){
    var t = "";
    Timer.set[i] = new Array();
    if(obj != window){
        Timer.set[i].obj = obj;
        t = "Timer.set["+i+"].obj.";
    }
    t += args[0]+"(";
    if(args.length > 2){
        Timer.set[i][0] = args[2];
        t += "Timer.set["+i+"][0]";
        for(var j=1; (j+2)<args.length; j++){
            Timer.set[i][j] = args[j+2];
            t += ", Timer.set["+i+"]["+j+"]";
    }}
    t += ");";
    Timer.set[i].call = t;
    return t;
}
Timer.callOnce = function(i){
    if(!Timer.set[i]) return;
    eval(Timer.set[i].call);
    Timer.set[i] = null;
}
Timer.getNew = function(){
    var i = 0;
    while(Timer.set[i]) i++;
    return i;
}
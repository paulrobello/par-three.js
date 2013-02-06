P.Menu = function(options){
  this.test(options);
};
P.Menu.prototype={
  test:function(){
    this.element=$('#menu-container').PieMenu({
      'starting_angle':-45, //(Starting Angle in degree)
      'angle_difference' : 90, //(Displacement angle in degree)
      'radius':80, //(circle radius in px)
      'menu':this
    });   
  },
  click:function(){  
    this.menu_button.click();
  },
  menuItemClick:function(e){
    var that=$(this).find("span");
    var data={
      name:'menuItemClick',      
      e:e,
      item:this,
      label:that.text()||""      
    };
    $( document ).trigger( 'menuItemClick', data );
    $(this).data('menu').click();
  }
};

(function( $ ) {
  $.fn.PieMenu = function(options) {
    var ele_angle=[],
        x_pos=[],
        y_pos=[];
	
    this.options = {
      'starting_angle'   : '0',
      'angle_difference' : '90',
      'radius':'150',
      'menu_element' : this.children('.menu_option').children(),
      'menu_button' : this.children('.menu_button'),
      'menu':null
    };
    var options = $.extend(this.options, options);
    options.angle = parseInt(options.angle_difference)/(options.menu_element.length-1);
    options.menu.menu_button=options.menu_button;

    var setPosition=function(val){
      $(options.menu_element).each(function(i,ele){
        $(ele).css({
	  'left' : (val==0) ?   0:y_pos[i],
	  'top'  : (val==0) ? -16:-x_pos[i],
        });
      });
    };  
    var myClick=function(e){
      var that=$(this);
      var data = {
        name:'menuClick',
        e:e,
        menuButton:this,
        menu:options.menu
      };
      $( document ).trigger( 'menuClick', data );      
      if(that.parent().hasClass('active')){
        setPosition(0);
	that.parent().removeClass('active');
	that.parent().addClass('inactive');
	data.name='menuClose';
	$( document ).trigger( 'menuClose', data );
      }else{
	setPosition(1);
	that.parent().addClass('active');
	that.parent().removeClass('inactive');
	data.name='menuOpen';
	$( document ).trigger( 'menuOpen', data );
      }	
      that.toggleClass("btn-rotate");

    };

	
    $(options.menu_button).unbind('click', myClick );
    $(options.menu_button).bind('click', myClick );

    return options.menu_element.each(function(i,ele){
      var ele=$(ele);
      ele.data('menu',options.menu);
      ele.click(options.menu.menuItemClick);
      var icon=$(ele).attr("icon") || '';
      var s=ele.find("span");
      if (icon) s.css('background-image','url("'+icon+'")');
      ele_angle[i] = (parseInt(options.starting_angle) + options.angle*(i))*Math.PI/180;
      x_pos[i] = (options.radius * Math.sin(ele_angle[i]));
      y_pos[i] = (options.radius * Math.cos(ele_angle[i]));
      $(ele).css({
	'-webkit-transform': 'rotate('+(90-ele_angle[i]*180/Math.PI)+'deg)',
	   '-moz-transform': 'rotate('+(90-ele_angle[i]*180/Math.PI)+'deg)',
	    '-ms-transform': 'rotate('+(90-ele_angle[i]*180/Math.PI)+'deg)',
	     '-o-transform': 'rotate('+(90-ele_angle[i]*180/Math.PI)+'deg)',
	    	'transform': 'rotate('+(90-ele_angle[i]*180/Math.PI)+'deg)',
      });
      s.css({
	'-webkit-transform': 'rotate('+(-(90-ele_angle[i]*180/Math.PI))+'deg)',
	   '-moz-transform': 'rotate('+(-(90-ele_angle[i]*180/Math.PI))+'deg)',
	    '-ms-transform': 'rotate('+(-(90-ele_angle[i]*180/Math.PI))+'deg)',
	     '-o-transform': 'rotate('+(-(90-ele_angle[i]*180/Math.PI))+'deg)',
	    	'transform': 'rotate('+(-(90-ele_angle[i]*180/Math.PI))+'deg)',
      });
    })	  
  };
})( jQuery );

P.Sound = function(options){
  this.init(options);
};
P.Sound.prototype={
  init:function(options){
    if (!sounds) sounds={};
  },
  play:function(name){
    console.log("Play sound "+name);
    if (!name || !sounds || !sounds[name]) return false;
    sounds[name].play();
  },
  stop:function(name){
    if (!name || !sounds || !sounds[name]) return false;
    sounds[name].stop();
  },
  pause:function(name){
    if (!name || !sounds || !sounds[name]) return false;
    sounds[name].pause();
  }
}

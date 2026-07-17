let config={
 enabled:false,
 time:"20:00",
 lastNotify:0
};



self.addEventListener("install",e=>{
 self.skipWaiting();
});



self.addEventListener("activate",e=>{
 self.clients.claim();
});



self.addEventListener("message",event=>{

 if(event.data.type==="SET_NOTIFICATION"){

   config.enabled = event.data.enabled;

   config.time = event.data.time;

   config.lastNotify = event.data.lastNotify;

 }

});



setInterval(()=>{


 if(!config.enabled)
 return;



 let now=new Date();


 let current =
 String(now.getHours()).padStart(2,"0")
 +":"+
 String(now.getMinutes()).padStart(2,"0");



 let cooldown = 90 * 60 * 1000;



 if(
 current === config.time ||
 Date.now()-config.lastNotify >= cooldown
 ){


 self.registration.showNotification(
 "JodJod",
 {
  body:"อย่าลืมบันทึกรายรับรายจ่ายวันนี้ 💰",
  icon:"icon.png"
 }
 );


 config.lastNotify=Date.now();


 }


},60000);
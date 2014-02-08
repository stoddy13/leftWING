module = {
    
    initialize: function(){
        
        module.page = leftWING.tag(document.body, {
            branding: ["div", {
                titlebar: ["ol", {
                    title: "li",
                    systemmenu: "li"
                }]
            }],
            topmenu: "div",
            content: "div"
        });
        
        module.page.title.innerHTML = leftWING.application.name;
        leftWING.insert.menu(leftWING.system.menu({
            popupAlign: "right",
            onLogin: module.login
        }))(module.page.systemmenu);
        leftWING.insert.menu(module.topmenu())(module.page.topmenu);
    },
    login: function(position){
        position.y += 25;
        leftWING.popup.loginDialog(position);
    },
    
    
    
    topmenu: function(){
        var menu = {
            items:[
                {
                    label: "Applications",
                    onClick: function(position){
                        window.location.reload();
                    }
                }
            ]
        };
        if(leftWING.session.user != "guest"){
            menu.items.push(
                {
                    label: "Users",
                    onClick: function(position){
                        window.location += "webdev";
                    }
                
                }
            );
        }
        return menu;
        
    },
    
}
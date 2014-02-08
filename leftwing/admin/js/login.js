module = {
    
    initialize: function(){

        var menu = leftWING.body.addChild(new leftWING.menu)
                   .addItem("Home")
                   .addItem("About us", function(position){
                        position.alert("We did it");  
                   })
                   .addItem("Impressum");
    
        var editor = leftWING.body.addChild(forms.login())
            .addButton("Login", function(position){
                alert("We did it", "Login");
            })
            .focus();
        leftWING.body.addButton("Dialog", function(event){
            event.position.show(dialogs.login());
        });
        

    }    
};
forms = {

    login: function(){
        var form = new leftWING.form()
            .submitTo("lw:leftWING\\environment::login")
            .onSubmitSuccess(function(position){
                
            });
         var account = form.addGroup();
        account.addText("user", "Username:");
        account.addPassword("pass", "Enter your Password:");
        account.addTextarea("comment", "Kommentar");
        
        return form;
    }
};

dialogs = {
    login: function(){
        return new leftWING.dialog("Login")
           .addContent(forms.login())
           .addButton("yad", function(event){
                event.position.show(dialogs.login());
            })
            .addButton("Login", "submit")
            .addButton("Close", "accept");
    }
};




















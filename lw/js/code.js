    var module = undefined;
new function(){
        
    var system = leftWING = this;
    system.translations = {};
    system.activePopup = undefined;

    
    system.initialize = function(){
        
        var method = "leftWING.initilize: ";
        
        if(module == undefined){
            throw method + "global variable 'module' missing.";
        }    
        if(!module.initialize || (typeof module.initialize != "function")){
            throw method + "member 'module.initialize' missing " +
                        "or it isn't of type function.";
        }
        
        system.translations = [];
        system.activePopup = undefined;
        system.dialogStack = [];
        system.page = {};
        
        system.body = new system.node("body");
        
        
        
        //system.initializingMessage = system.body.addChild("div")
        //    .addHtml("Retrieving data ...")
        //    .addClass("leftwing-initializing-message");

        system.startWaiting();
        
        var phrases = system.createPhraseArray({
            
            'button label': [
                 "OK", "Cancel", "Yes", "No", "Close", "Login", "Logout"
            ],
            'tool tip': [
                "Click here to select another language",
                "Click here to login",    
            ],
            'status text': [
                "Ready|I'm ready to follow your commands",
            ],
            'input field label':[
                "Username", "Password", "Re-enter password", "Account"
            ],
            'user info':[
                "{0} Login|{0}: application name",
                "{0} Logout|{0}: application name",
                "Enter your acccount data"
            ]
        });
        
        system.request(
            'lw:leftWING\\environment::data', { phrases: phrases},
            function(response){
                if(response.error.code != 0){
                    //alert(response.error.message);
                    return;
                }
                var data = response.data;
                system.application = data.application;
                system.session = data.session;
                system.availableLanguages = data.availableLanguages;
                system.translations = system.createHash(phrases, data.translations);
                system.stopWaiting();
                //system.initializingMessage.remove();
                module.initialize();
            }
        );
    };
    system.request = function(method, parameters, onSuccess){

        var request = undefined;
        
        try{
            request = new XMLHttpRequest();
        }
        catch(Microsoft){
            try{
                request = new ActiveXObject("Msxml2.XMLHTTP");
            }
            catch (noMicrosoft){
                try{
                    request = new ActiveXObject("Microsoft.XMLHTTP");
                } 
                catch(failed){
                    request = null;
                }
            }  
        }
        if(this.request == null)
            throw 'Couldn\'t create \'XMLHttpRequest\'.';
        
        request.onreadystatechange = function(){
            
            if(this.readyState != 4){
                var message = method + ": " + [
                    "initializing request ...",
                    "connection to server established ...",
                    "response received ...",
                    "processing response ..."][this.readyState];
                //system.ajaxProgressConsole.writeln(message);    
            }
            else if(this.status == 200){
                //alert(request.responseText);
                var response = eval('(' + this.responseText + ')');
                if(response.error && response.error.code == 10)
                    alert(response.error.message);
                else{
                    //system.ajaxProgressConsole.writeln(method + ": request successfully finished.");
                    onSuccess(response);
                }
            }
            else
                this.alertError('HTTP', this.request.status, this.request.statusText);
        };
        
        var data = ['t=a', 'm=' + method];
        
        for(var key in parameters){
            if(parameters[key] instanceof Array){
                for(var i = 0; i < parameters[key].length; i++)
                    data.push(encodeURIComponent(key + '[]') + '=' +
                              encodeURIComponent(parameters[key][i]));
            }
            else
                data.push(encodeURIComponent(key) + '=' +
                          encodeURIComponent(parameters[key]));
        }
        data = data.join('&');
        url = 'index.php'
        //alert("url: " + url + "\ndata: " + data);

        //system.ajaxProgressConsole.writeln(method + ": connecting to server ....");
        request.open('post', url, true);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        request.setRequestHeader('Content-length', data.length);
        request.setRequestHeader('Connection', 'close');
        //system.ajaxProgressConsole.writeln(method + ": sending data ....");
        request.send(data);
        
    };
    system.translate = function(phrase, args){
        var translation = (system.translations[phrase] ? system.translations[phrase] : phrase);
        for(var i = 1; i < arguments.length; i++){
            var pattern = new RegExp("\\{" + (i - 1) + "\\}", "g");
            translation = translation.replace(pattern, arguments[i]);
        }
        return translation;
        
    };
    system.createPhraseArray = function(hash){
        var phrases = [];
        for(var category in hash){
            for(var i = 0; i < hash[category].length; i++){
                var parts = hash[category][i].split("|");
                var content, hint;
                switch(parts.length){
                    case 2:
                        content = parts[0];
                        hint = "|" + parts[1];
                        break;
                    case 1:
                        content = parts[0];
                        hint = "";
                        break;
                    default:
                        throw "system.createPhraseArray: Argutment '" +
                            hash[category][i] + "' doesn't match content[|hint].";
                }
                phrases.push(content + "|" + category + hint);
            }
        }
        return phrases;
    };
    system.createHash = function(keys, values){
        if(keys.length != values.length){
            throw "key.length != value.length";
        }
        var hash = {};
        for(var i in keys){
            hash[keys[i]] = values[i];
        }
        return hash;
    };
    system.arrayContainsItem = function(array, item){
        var n = array.length;
        for(var i = 0; i < n && array[i] != item; i++);
        return (i < n);
    };
    system.positionNode = function(node, position){
            
        var left = position.x;
        var top = position.y;
        
        var right = window.innerWidth - left;
        if(right < node.offsetWidth && right < left)
            left -= node.offsetWidth;
        left = Math.max(0, left);
        
        var bottom = window.innerHeight - top;
        if(bottom < node.offsetHeight && bottom < top)
            top -= node.offsetHeight;
        top = Math.max(0, top);

        node.style.left = left + 'px';
        node.style.top = top + 'px';
    };
    system.positionToMouse = function(node, event){
        
        system.positionNode(node, {x: event.clientX, y: event.clientY});
    },
    system.removeClass = function(node, className){
        var method = "system.removeClass: ";
        if (!node || !(node instanceof Node)) {
            throw method + "Argument 'node' isn't instance of Node.";
        }
        if(!className|| (typeof className != "string")){
            throw method + "Argument 'className' isn't of type 'string'.";
        }
        var existingClassNames = node.className.trim().split(/\s+/);
        var removedClassNames = className.trim().split(/\s+/);
        var survivingClassNames = [];
        for(var i = 0; i < existingClassNames.length; i++){
            var existingClassName = existingClassNames[i];
            if(!system.arrayContainsItem(removedClassNames, existingClassName))
                survivingClassNames.push(existingClassName);
        }
        node.className = survivingClassNames.join(' ').trim();
    };
    system.startWaiting = function(){
        if(!system.waitCover){
            //system.waitCover = system.body.addChild("div");
            //system.waitCover.node.style.position = "absolute";
            //system.waitCover.node.style.top = "0";
            //system.waitCover.node.style.left = "0";
            //system.waitCover.node.style.bottom = "0";
            //system.waitCover.node.style.right = "0";
            //system.waitCover.node.style.cursor = "wait";
        }
    };
    system.stopWaiting = function(){
        if(system.waitCover){
            //system.waitCover.remove();
        }
        system.waitCover = null;
    };
    system.clearBranch = function(parent){
        while(parent.firstChild){
            parent.removeChild(parent.firstChild)
        }
    };
    system.error = function(message){
        throw "leftWING " + message;
    };
    system.clone = function(object){
        var clone = {};
        for(var property in object){
            clone.property = object.property;
        }
        return clone;
    }
    
    system.position = function(x, y){
        if((typeof x !== "number") || (typeof y !== "number")){
            throw "system.position: " +
                  "Arguments 'x' and 'y' " +
                  "must both be of type 'number'.";
        }
        this.x = x;
        this.y = y;
    };
    system.position.prototype = new Object();
    system.position.prototype.alert = function(message, header){
        try{
            var messageText = ""
            if(typeof message !== "undefiend"){
                if(typeof message !== "string"){
                    throw "Optional argument 'message' submitted " +
                          "but is isn't of type 'string'.";
                }
                messageText = message;
            }
            var headerText = ""
            if(typeof header !== "undefiend"){
                if(typeof header !== "string"){
                    throw "Optional argument 'header' submitted " +
                          "but is isn't of type 'string'.";
                }
                headerText = header;
            }
            return new system.dialog(header)
                .addContent(new system.node("div").addHtml(messageText))
                .addButton("OK", "accept")
                .showModal(this);
        }
        catch(exception){
            system.error("system.position.prototype.alert: " + exception);
        }
    }
    system.position.prototype.show = function(dialog){
        return dialog.showModal(this);
    };

    system.refine = function(event){
        
        try{
        
            if(!(event instanceof Event)){
                throw "Argument 'event' missing " +
                      "or it isnt' instance of 'Event'.";
            }
    
            if(!("systemNode" in event.target)){
                throw "Argument 'event.target' " +
                      "doesn't contain the key 'systemNode'.";
            }
            this.targetNode = event.target.systemNode;
            
            if((typeof event.clientX === "number") && (typeof event.clientY === "number")){
                event.position = new system.position(event.clientX, event.clientY);
            }
            else{
                event.position = event.target.getPosition();
            }
            return event;
            
        }
        catch(exception){
            throw "system.event: " + exception;
        }
    };
    
    system.node = function(tag){
        switch(typeof tag){
            case "undefined":
                break;
            case "string":
                this.node = ((tag == "body") ? this.node = document.body : this.node = document.createElement(tag));
                this.node.systemNode = this;
                this.tabIndex = -1;
                this.setAttribute("tabindex", this.tabIndex);
                break;
            default:
                throw "Argument 'tag' isn't of type 'string' but of type '" + typeof string + "'.";
        }
    };
    system.node.prototype = new Object();
    system.node.prototype.addButton = function(label, onClick){
        try{
            return this.addChild(new system.button(label, onClick));
        }
        catch(exception){
            system.error("system.node.prototype.addButton: " + exception);
        }
    };
    system.node.prototype.addChild = function(child){
        try{
            if(typeof child === "string"){
                child = new system.node(child);
            }
            else if(!(child instanceof system.node)){
                throw "Argument 'child' is " +
                      "neither of type 'string' " +
                      "nor instance of 'system.node'.";
            }
            this.node.appendChild(child.node);
            return child;
        }
        catch(exception){
            system.error("system.node.prototype.addChild: " + exception);
        }
    };
    system.node.prototype.addClass = function(classes){
        if(!classes || (typeof classes !== "string")){
            system.error(method + "Argument 1 'classes' isn't of type 'string'.");
        }
        var existingClassNames = this.node.className.trim().split(/\s+/);
        var addedClassNames = classes.trim().split(/\s+/);
        for(var i = 0; i < addedClassNames.length; i++){
            var addedClassName = addedClassNames[i];
            if(!system.arrayContainsItem(existingClassNames, addedClassName))
                existingClassNames.push(addedClassName);
        }
        this.node.className = existingClassNames.join(' ').trim();
        return this;
    };
    system.node.prototype.addEventListener = function(event, handler, downPropagating){
        var downPropagation = this.assureEventListenerArguments(event, handler, downPropagating);
        this.node.addEventListener(event, handler, downPropagating);
    };
    system.node.prototype.addForm = function(){
        try{
            return this.addChild(new system.form());
        }
        catch(exception){
            system.error("system.node.prototype.addForm: " + exception);
        }
    };
    system.node.prototype.addId = function(id){
        try{
            if(!id || (typeof id !== "string")){
                throw "Argument 'id' missing " +
                      "orisn't of type 'string'.";
            }
            if(document.getElementById(id)){
                throw "Argument 'id': '" + id + "' isn't unique.";
            }
            this.node.setAttribute("id", id);
            return this;
        }
        catch(exception){
            system.error("system.node.prototype.addId: " + exception);
        }
    };
    system.node.prototype.addHtml = function(html){
        if(typeof html !== "string"){
            system.error("system.node.prototype.addHtml: " +
                         "Argument 'html' missing " +
                         "or it isn't of type 'string'.");
        }
        this.node.innerHTML += html;
        return this;
    };
    system.node.prototype.addList = function(){
        try{
            return this.addChild(new system.list());
        }
        catch(exception){
            system.error("systemnode.prototype.addList: " + exception);
        }
    };
    system.node.prototype.allowFocus = function(){
        this.node.setAttribute("tabindex", this.tabIndex);
        for(var i = 0; i < this.node.childNodes.length; i++){
            var child = this.node.childNodes[i];
            if ("systemNode" in child) {
                child.systemNode.allowFocus();
            }
        }
        return this;
    };
    system.node.prototype.assureEventListenerArguments = function(event, handler, downPropagation){
        try{
            if(typeof event !== "string"){
                throw "Arguemnt 'event' missing " +
                      "or it isn't of type 'string'.";
            }
            if(typeof handler !== "function"){
                throw "Argument 'handler' missing " +
                      "or it isn't of type 'function'.";
            }
            var direction = false;
            if (typeof downPropagating !== "undefined") {
                if(typeof downPropagating !== "boolean"){
                    throw "Argument 'downPropagating' missing " +
                          "or it isn't of type 'boolean'.";
                          
                }
                direction = downPropagating;
            }
            return direction;
        }
        catch(exception){
            system.error("system.node.prototype.checkEventListenerArguments: " + exception);
        }
        
    };
    system.node.prototype.bind = function(event, method, onDownPropagation){
        try{
            if(typeof event !== "string"){
                throw "Argument 'event' missing " +
                      "or it isn't type of 'string'.";
            }
            if((typeof method !== "string") || !(method in this) || (typeof this[method] !== "function")){
                throw "Argument 'method' missing " +
                      "or it isn'T a valid method of this instance.";
            }
            var direction = false;
            if(typeof onDownPropagation !== "undefined"){
                if(typeof onDownPropagation != "boolean"){
                    throw "Argument 'onDownPropagation' missing " +
                          "or it isn't of type 'boolean'.";
                }
                dirction = onDownPropagation;
            }
            var that = this;
            this.node.addEventListener(event, function(e){
                that[method](e);
            }, direction);
        }
        catch(exception){
            system.error("system.node.prototype.bind: " + exception);
        }
    };
    system.node.prototype.getPosition = function(){
        var container = this.node;
        var left = 0, top = 0;
        do{
            left += container.offsetLeft;
            top += container.offsetTop;
        }while((container = container.offsetParent));
        return new system.position(left, top);
    };
    system.node.prototype.isOrIsParentOf = function(node){
        if(!node || !(node instanceof system.node)){
            system.error("system.node.prototype.isOrIsParentOf: " +
                         "Argument 'node' missing " +
                         "or it isn't instance of 'system.node'.");
        }
        var parent = node.node;
        while(parent && (parent != this.node) && (parent.parentNode)){
            parent = parent.parentNode;
        }
        return parent == this.node;  
    };
    system.node.prototype.positionTo = function(position){
        
        if(!position || (typeof position !== "object")){
            system.error("system.node.prototype.positionTo: " +
                         "Argument 'position' missing " +
                         "or it isn't of type 'object'.");
        }
        this.node.style.position = "absolute";
        var left = position.x;
        var top = position.y;
        
        var right = window.innerWidth - left;
        if(right < this.node.offsetWidth && right < left)
            left -= this.node.offsetWidth;
        left = Math.max(0, left);
        
        var bottom = window.innerHeight - top;
        if(bottom < this.node.offsetHeight && bottom < top)
            top -= this.node.offsetHeight;
        top = Math.max(0, top);

        this.node.style.left = left + 'px';
        this.node.style.top = top + 'px';
    };
    system.node.prototype.preventFocus = function(){
        this.node.setAttribute("tabindex", -1);
        for(var i = 0; i < this.node.childNodes.length; i++){
            var child = this.node.childNodes[i];
            if("systemNode" in child){
                child.systemNode.preventFocus();
            }
        }
        return this;
    };
    system.node.prototype.remove = function(){
        while(this.node.firstChild){
            var child = this.node.firstChild;
            if(child.systemNode){
                child.systemNode.remove();
            }
            else{
                this.node.removeChild(child);
            }
        }
        if("parentNode" in this.node){
            this.node.parentNode.removeChild(this.node);
        }
    };
    system.node.prototype.removeChilds = function(){
        while(this.node.hasChildNodes()){
            this.node.removeChild(this.node.firstChild);
        }
        return this;
    };
    system.node.prototype.removeEventListener = function(event, handler, downPropagating){
        downPropagating = this.assureEventListenerArguments(event, handler, downPropagating);
        this.node.removeEventListener(event, handler, downPropagating);
    };
    system.node.prototype.setAttribute = function(name, value){
        try{
            if(typeof name !== "string"){
                throw "Argument 'name' missing " +
                      "or it isn'T of type 'string'";
            }
            if((typeof value !== "string") && (typeof value !== "number")){
                throw "Argument 'value' missing " +
                      "or it is neither of type 'string' " +
                      "nor of type 'number'.";
            }
            this.node.setAttribute(name, value);
            return this;
        }
        catch(exception){
            system.error("system.node.prototype.setAttribute: " + exception);
        }
    }
    system.node.prototype.setTabIndex = function(index){
        try{
            if (typeof index != "number") {
                throw "Argument 'index' missing " +
                      "or it isn't of type 'number'.";
            }
            index = Math.round(index);
            if(index < - 1){
                throw "Argument 'index': " + index +
                      " must not be smaller than -1.";
            }
        }
        catch(exception){
            system.error("system.node.prototype.tabIndex: " + exception);
        }
        this.tabIndex = index;
        this.node.setAttribute("tabindex", index);
        return this;
    };
    
    
    system.button = function(label, onClick){
        
        try{
            system.node.call(this, "button");
            this.setTabIndex(0);
        
            if(typeof label !== "string"){
                throw "Argument 'label' missing " +
                      "or it isn't of type 'string'.";
            }
            this.label = label;
            this.addHtml(this.label);
            
            if(typeof onClick !== "undefined"){
                
                this.onClick = onClick;
                
                if(typeof onClick === "function"){
                    this.bind("click", "handleClick");
                }
                else if(typeof onClick !== "string"){
                   throw "Optional argument 'onClick' submitted " +
                        "but it is neither of type 'function' nor of type 'string'.";
               }
            }
        }
        catch(exception){
            throw "system.button: " + exception;
        }
   };
    system.button.prototype = new system.node();
    system.button.prototype.handleClick = function(event){
        event.position = this.getPosition();
        event.stopPropagation();
        event.preventDefault();
        this.onClick(event);
    };
    system.button.prototype.focus = function(){
        this.node.focus();
    }
    
    system.list = function(){
        system.node.call(this, "ol");
        this.items = [];
    };
    system.list.prototype = new system.node();
    system.list.prototype.push = function(item){
        try{
            if(typeof item !== "object"){
                throw "Argument 'item' isn't of type 'object'.";
            }
            
            var container = this.addChild("li");
            if(item instanceof system.node){
                item = container.addChild(item);
                item.listIndex = this.items.length;
            }
            else{
                if(!("label" in item) || (typeof item.label !== "string")){
                    throw "Argument 'item neither is instance of 'system.node' " +
                          "nor is it an object containing a string member 'label'.";
                }
                container.addHtml(item.label);
                container.listIndex = this.items.length;
            }
            
            
            this.items.push(item);
            return this;
        }
        catch(exception){
            system.error("system.list.prototype.push: " + exception);
        }
    };
    system.list.prototype.contain = function(item){
        if(!(item instanceof system.node)){
            system.error("system.list.prototype.contain: " +
                         "Argument 'item' isn't instance of 'system.node'.");
        }
        return (this.node == item.node.parentNode.parentNode);
            
    }
    system.list.prototype.getFirst = function(){
        return ((this.items.length > 0) ? this.items[0] : undefined);
    };
    system.list.prototype.getLast = function(){
        return ((this.items.length > 0) ? this.items[this.items.length - 1] : undefined);
    };
    
    
    system.field = function(label){
        try{
            
            if(typeof label === "undefined"){
                return;
            }
            system.node.call(this, "label");
            this.label = this.addChild("span").addHtml(label);
            this.label.fieldNode = this;
        }
        catch(exception){
            throw "system.field: " + exception;
        }
    };
    system.field.prototype = new system.node();
    system.field.prototype.addEventListener = function(event, handler, downPropagating){
        this.control.addEventListener(event, handler, downPropagating);
    }
    system.field.simple = function(tag, label, value){
        try{
            if(arguments.length == 0){
                return;
            }
            system.field.call(this, label);
            if(typeof tag !== "string"){
                throw "Argument 'tag' missing' " +
                      "or it isn't of type 'string'.";
            }
            this.control = this.addChild("span").addChild(tag);
            this.control.node.fieldNode = this;
            this.control.setTabIndex(0);
            if(typeof value !== "undefined"){
                this.control.setAttribute("value", value);
            }
        }
        catch(exception){
            throw "system.field.simple: " + exception;
        }
    };
    system.field.simple.prototype = new system.field();
    system.field.simple.prototype.onBlur = function(event){

    };
    system.field.simple.prototype.focus = function(){
        this.control.node.focus();
        return this;
    };
    system.field.simple.prototype.getValue = function(){
        return this.control.value;  
    };
    system.field.text = function(label, value, maxLength){
        
        try{
            system.field.simple.call(this, "input", label, value, maxLength);
            this.control.setAttribute("type", "text");
            if(typeof maxLength !== "undefined"){
                this.control.setAttribute("maxlength", maxLength);
            }
        }
        catch(exception){
            throw "system.field.text: " + exception;
        }
    };
    system.field.text.prototype = new system.field.simple();
    system.field.password = function(label, value, maxLength){
        try{
            system.field.simple.call(this, "input", label, value);
            this.control.setAttribute("type", "password");
            if(typeof maxLength !== "undefined"){
                this.control.setAttribute("maxlength", maxLength);
            }
            
        }
        catch(exception){
            throw "system.field.password: " + exception;
        }
    };
    system.field.password.prototype = new system.field.simple();
    system.field.textarea = function(label, value){
        try{
            system.field.simple.call(this, "textarea", label, value);
        }
        catch(exception){
            throw "system.field.textarea: " + exception;
        this.control = this.addChild("textarea")
        }
    };
    system.field.textarea.prototype = new system.field.simple();
    
    system.form = function(){
        try{
            system.node.call(this, "form");
            this.bind("click", "onClick");
        }
        catch(exception){
            throw "system.form: " + exception;
        }
        
    };
    system.form.prototype = new system.node();
    system.form.prototype.addButton = function(label, onClick){
        try{
            if(!("buttons" in this)){
                this.buttons = this.addList();
            }
            this.buttons.push(new system.button(label, onClick));
            return this;
        }
        catch(exception){
            system.error("system.form.prototype.addButton: " + exception);
        }
    };
    system.form.prototype.addField = function(name, field){
        try{
            if(typeof name != "string"){
                throw "Argument 'name' missing " +
                      "or it isn't of type 'string'.";
            }
            if(!(field instanceof system.field)){
                throw "Argument 'field' missing " +
                "or it isn't instance of system.field.";
            }
            if(!("fields" in this)){
                this.fields = {};
                this.firstField = field;
            }
            if(name in this.fields){
                throw "Argument 'name' isn't unique in this.fields.";
            }
            this.fields.name = field;
            this.lastField = field;
            return this;
        }
        catch(exception){
            system.error("system.form.prototype.addField: " + exception);
        }
    };
    system.form.prototype.addGroup = function(label){
        try{
            return this.addChild(new system.form.group(this, label));
        }
        catch(exception){
            system.error("system.form.protoype.addGroup: " + exception);
        }
    };
    system.form.prototype.focus = function(){
        if("firstField" in this){
            this.firstField.focus();
        }
        return this;
    };
    system.form.prototype.getValues = function(){
        var values = {};
        if("hiddenFields" in this){
            for(var name in this.hiddenFields){
                values.name = this.hiddenFields.name;
            }
        }
        for(var name in this.fields){
            values.name = this.fields.name.getValue();
        }
        return values;
    };
    system.form.prototype.onClick = function(event){
        
        if(("systemNode" in event.target) && (event.target.systemNode instanceof system.button)){
            var button = event.target.systemNode;
            if(("buttons" in this) && this.buttons.contain(button)){
                event.preventDefault();
                event.stopPropagation();
                if(typeof button.onClick === "string"){
                    if(!(button.onClick in this)){
                        system.error("system.form.prototype.onClick: " +
                                     "Instance doesn't contain '" +
                                     button.onClick + "'.");
                    }
                    this[button.onClick](new system.position(event.clientX, event.clientY));
                }
                
            }
        }
    };
    system.form.prototype.onSubmitError = function(handler){
        try{
            alert(arguments.callee.caller.toString());
            if(!("serverMethod" in this)){
                throw "No server method submitted so far. " +
                      "Call submitTo first.";
            }
            if(typeof handler !== "function"){
                system.error("Argument 'handler' missing " +
                             "or it isn't of type 'function'.");
            }
            this.handleSubmitError = handler;
            return this;
        }
        catch(exception){
            system.error("system.form.prototype.onSubmitError: " + exception);
        }
    };
    system.form.prototype.onSubmitSuccess = function(handler){
        try{
            if(!("serverMethod" in this)){
                throw "No server method submitted so far. " +
                      "Call submitTo first.";
            }
            if(typeof handler !== "function"){
                system.error("Argument 'handler' missing " +
                             "or it isn't of type 'function'.");
            }
            this.handleSubmitSuccess = handler;
            return this;
        }
        catch(exception){
            system.error("system.form.prototype.onSubmitSuccess: " + exception);
        }
    };
    system.form.prototype.submit = function(position){
        try{
            if(!("serverMethod" in this)){
                throw "Instance doesn't contain 'serverMethod'.";
            }
            if(!(position instanceof system.position)){
                throw "Argument 'position' missing " +
                      "or it isn't instance of 'system.position'. " +
                      "We need this argument to know were to " +
                      "display status information for the " +
                      "submission process.";
            }
            var dialog = position.alert("<p>sending data ...</p>", "Login");
            var form = this;
            system.request(
                this.serverMethod,
                this.getValues,
                function(response){
                    if(response.error.code != 0){
                        if("handleSubmitError" in form){
                            form.onSubmitError(event, response);
                        }
                        else{
                            dialog.content.addHtml("<p>" + response.error.message + "</p>");
                        }
                    }
                    else{
                        if("handleSubmitSuccess" in form) {
                            form.onSubmitSuccess(event);
                        }
                    }
                }
            );
        }
        catch(exception){
            system.error("system.form.prototype.submit: " + exception);
        }
    };
    system.form.prototype.submitTo = function(serverMethod){
        if(typeof serverMethod !== "string"){
            system.error("system.form.prototype.submitTo: " +
                         "Argument 'serverMethod' missing' " +
                         "or it isn't of type 'string'.");
        }
        this.serverMethod = serverMethod;
        return this;
    };
    
    system.form.group = function(form, label){
        try{
            system.node.call(this, "fieldset");
            
            if(!(form instanceof system.form)){
                throw "Argument 'form' isn't instance of 'system.form'.";
            }
            this.form = form;
            
            if(typeof label !== "undefined"){
               if(typeof label !== "string"){
                throw "Optional argument 'label' submitted " +
                      "but it isn't of type 'string'.";
                }
                this.addChild("legend").addHtml(label);
                this.addClass("leftwing-labeled");
            }
        }
        catch(exception){
            throw "system.form.group: " + exception;
        }
    };
    system.form.group.prototype = new system.node();
    system.form.group.prototype.addText = function(name, label, value, maxLength){
        try{
            return (this.form.addField(name, this.addChild(new system.field.text(label, value, maxLength))));
        }
        catch(exception){
            system.error("system.form.group.prototype.addText: " + exception);
        }
    };
    system.form.group.prototype.addPassword = function(name, label, value, maxLength){
        try{
            return (this.form.addField(name, this.addChild(new system.field.password(label, value, maxLength))));
        }
        catch(exception){
            system.error("system.form.group.prototype.addPassword: " + exception);
        }
    };
    system.form.group.prototype.addTextarea = function(name, label, value){
        try{
            return (this.form.addField(name, this.addChild(new system.field.textarea(label, value))));
        }
        catch(exception){
            system.error("system.form.group.prototype.addTextarea: " + exception);
        }
    };
    
    system.moveableNode = function(tag){
        try{
            if(typeof tag === "undefined"){
                return;
            }
            system.node.call(this, tag);
            
            var container = this;
            container.addEventListener('mousedown', function(event){
                if("systemNode" in event.target){
                    var node = event.target.systemNode;                    
                    if(container.isOrIsParentOf(node) && node.isCaption){
                        container.start(event);
                    }
                }
            });
        }
        catch(exception){
            throw "system.moveableNode: " + exception;
        }
    };
    system.moveableNode.prototype = new system.node();
    system.moveableNode.prototype.start = function(event){
        var that = this;
        this.handleMove = function(event){that.move(event);};
        this.handleBreak = function(event){that.break(event);};
        this.handleStop = function(event){that.stop(event);};
        window.addEventListener('mouseup', this.handleStop, true);
        window.addEventListener('mouseout', this.handleBreak, true);
        window.addEventListener('mousemove', this.handleMove, true);
        this.node.page = this.getPosition();
        this.mouseOffset = {};
        this.mouseOffset.x = event.pageX - this.node.page.x;
        this.mouseOffset.y = event.pageY - this.node.page.y;
        if("onMoveStart" in this){
            this.onMoveStart(event);
        }
    };
    system.moveableNode.prototype.move = function(event){
        if("mouseOffset" in this){
            this.node.style.position = 'absolute';
            this.node.style.left = (event.pageX - this.mouseOffset.x) + 'px';
            this.node.style.top = (event.pageY - this.mouseOffset.y) + 'px';
            if(this.node.style.visibility == 'hidden')
                this.node.style.visibility = 'visible';
            if("onMove" in this)
                this.onMove(event);
        }
    };
    system.moveableNode.prototype.break = function(event){
        if((event.clientX <= 0) || (window.innerWidth <= event.clientX) ||
            (event.clientY <= 0) || (window.innerHeight <= event.clientY)){
             this.stop(event);
         }
    };
    system.moveableNode.prototype.stop = function(event){
        this.mouseOffset = undefined;
        window.removeEventListener('mouseup', this.handleStop, true);
        window.removeEventListener('mouseout', this.handleBreak, true);
        window.removeEventListener('mousemove', this.handleMove, true);
        if("onMoveStop" in this){
            this.onMoveStop(event);
        }
    };

    system.dialog = function(header){

        try{
            
            system.moveableNode.call(this, "div");            
            this.addClass("leftwing-dialog");
            
            this.capturedEvents = ["mousedown", "click", "keydown", "contextmenu"];
            
            var text = "leftWING";
            if(typeof header !== "undefined"){        
                if(typeof header !== "string"){
                    throw "Optional argument 'header' submitted " +
                          "but it isn't of type 'string'.";
                }
                text = header;
            }
            this.addChild("div")
                .addHtml(text)
                .addClass("leftwing-no-text-selection leftwing-click-target")
                .isCaption = true;
        }
        catch(exception){
            throw "system.dialog: " + exception;
        }
    };
    system.dialog.prototype = new system.moveableNode();
    system.dialog.prototype.addButton = function(label, onClick, keyCodes){
        try{
            if(!("buttons" in this)){
                this.buttons = this.addList();
            }
            this.buttons.push(new system.button(label, onClick, keyCodes));
            return this;
        }
        catch(exception){
            system.error("system.dialog.prototype.addButton: " + exception);
        }
    };
    system.dialog.prototype.addContent = function(content){
        try{
            if(!(content instanceof system.node)){
                throw "Argument 'content' missing " +
                      "or it isn't instance of 'system.node'";
            }
            this.content = this.addChild(content).addClass("leftwing-dialog-content");
            return this;
        }
        catch(exception){
            system.error("system.dialog.prototype.addContent: " + exception)
        }
    }
    system.dialog.prototype.captureFocus = function(){

        this.modal = true;

        this.allowFocus().focus();

        var that = this;
        this.modalHandler = function(event){that.onCapturedEvent(event);};
        for(var i = 0; i < this.capturedEvents.length; i++){
            window.addEventListener(this.capturedEvents[i], this.modalHandler, true);
        }
    };
    system.dialog.prototype.focus = function(){
        if(!this.focusContent()){
            this.buttons.getLast().focus();
        }    
    };
    system.dialog.prototype.focusContent = function(){
        if(("focus" in this.content) && (typeof this.content.focus === "function")){
            this.content.focus();
            return true;
        }
        return false;
    };
    system.dialog.prototype.onCapturedEvent = function(event){
        if(this.isWaiting ||
           !("systemNode" in event.target) ||
           !this.isOrIsParentOf(event.target.systemNode)){
            event.stopPropagation();
            event.preventDefault();
        }
    };
    system.dialog.prototype.onClick = function(event){
        
        if(("systemNode" in event.target) && event.target.systemNode instanceof system.button){
            var button = event.target.systemNode;
            if(this.buttons.contain(button)){
                event.preventDefault();
                event.stopPropagation();
                
                if(typeof button.onClick === "string"){
                    if((button.onClick in this.content) && (typeof this.content[button.onClick] === "function")){
                        this.content[button.onClick](button.getPosition());
                    }
                    else{
                        switch(button.onClick){
                            case "accept":
                                this.remove();
                                break;
                            default:
                                system.error("button.onClick '" +
                                             button.onClick + "' not yet supported.");
                        }
                    }
                }
            }
        }
    };
    system.dialog.prototype.onMoveStart = function(){
        this.activeElement = document.activeElement;
    };
    system.dialog.prototype.onMoveStop = function(){
        this.activeElement.focus();
    }
    system.dialog.prototype.releaseFocus = function(){
        
        this.modal = false;
        
        this.preventFocus();
        
        for(var i = 0; i < this.capturedEvents.length; i++){
            window.removeEventListener(this.capturedEvents[i],this.modalHandler, true);
        }
    };
    system.dialog.prototype.remove = function(){
        
        this.releaseFocus();
        
        system.modalDialogs.pop();
        if(system.modalDialogs.length > 0){
            system.modalDialogs[system.modalDialogs.length - 1].captureFocus();
        }
        else{
            system.body.allowFocus();
        }
        this.activeBefore.focus();
        
        system.moveableNode.prototype.remove.call(this);
    };
    system.dialog.prototype.showModal = function(position){
        try{
            if(!(position instanceof system.position)){
                throw "Argument 'position' missing " +
                      "or it isn't instance of 'system.position'.";
            }
            system.body.addChild(this).positionTo(position);
            
            if(!("content" in this)){
                throw "No content supplied so far. " +
                      "Use method 'addContent' to supply " +
                      "a 'system.node' object.";
            }
            if(!("buttons") in this){
                throw "No buttons supplied so far. " +
                      "Use method 'addButton' to supply " +
                      "at least one 'system.button' object.";
            }
            
            var that = this;
            if("firstField" in this.content){
                this.content.firstField.addEventListener("keydown", function(event){
                    if(event.keyCode == 9 && event.shiftKey){
                        event.preventDefault();
                        that.buttons.getLast().focus();
                    }
                });
            }
            this.buttons.getLast().addEventListener("keydown", function(event){
                if(event.keyCode == 9 && !event.shiftKey){
                    event.preventDefault();
                    if(!that.focusContent()) {
                        that.buttons.getFirst().focus();
                    }
                }
            });
            if(!("modalDialogs" in system)){
                system.modalDialogs = [];
            }
            if(system.modalDialogs.length > 0){
                system.modalDialogs[system.modalDialogs.length - 1].releaseFocus();
            }
            else{
                system.body.preventFocus();
            }
            system.modalDialogs.push(this);
            this.activeBefore = document.activeElement;
            
            this.captureFocus();
            this.bind("click", "onClick");
            return this;
        }
        catch(exception){
            system.error("system.dialog.prototype.showModal: " + exception);
        }
    };
    system.dialog.prototype.startWating = function(){
        this.buttonsLocked = true;
        system.startWaiting();
    };
    system.dialog.prototype.stopWaiting = function(){
        system.stopWaiting();
        this.buttonsLocked = false;
    };
    
    system.menu = function(){
        try{
            system.list.call(this);
            this.addClass("leftwing-menu leftwing-no-text-selection leftwing-no-wrap leftwing-click-target");
            this.bind("click", "onClick");
        }
        catch(exception){
            throw "system.menu: " + exception;
        }
    };
    system.menu.prototype = new system.list();
    system.menu.prototype.addItem = function(label, onClick){
        this.push({label: label, onClick: onClick});
        return this;
    }
    system.menu.prototype.onClick = function(event){
        if ("systemNode" in event.target) {
            //code
        }
    }
    
    system.forms = {
        login: {
            fieldSets: [
                {
                    legend: false,
                    fields: [
                        function(container){
                            return container.addInput({
                                type: "text",
                                label: system.translate("username"),
                                name: "name"
                            });
                        },
                        function(container){
                            return container.addInput({
                                type: "password",
                                label: system.translate("Password"),
                                name: "password"
                            });
                        }
                    ]
                }
            ],
            buttons: {
                submit: {
                    label: system.translate("Login"),
                    onClick: "lw:leftWING\\environment::login"
                }
            }
            
        },
        changePassword: function(){
            
            return {
                fieldsets: [
                    {
                        legend: system.translate("New Password"),
                        fields: [
                            system.insert.input({
                                type: "password",
                                label: system.translate("Password"),
                                name: "pass",
                                help: system.translate("{0} ≤ length(Password) ≤ {1}", 8, 80)
                            }),
                            system.insert.input({
                                type: "password",
                                label: system.translate("Retype Password"),
                                name: "repass",
                                help: system.translate(
                                        "Copy and paste isn't a good idea for retyping the password " +
                                        "since you could easily kick yourself out of the system " +
                                        "if you can't remember your password correctly")
                            })
                        ]
                    }
                ]
            };
        }
    };
    system.dialogs = {
        
        dialog: function(position, dialog){

            if(!position || (typeof position != "object") || (position.x == undefined) || (position.y == undefined)){
                throw "system.popup.dialog: Argument 'position' missing or invalid.";
            }
            dialog.position = position;
            system.insert.dialog(dialog);
        },
        message: function(initial){

            var method = "system.dialogs.message: ";
            
            if(!initial || (typeof initial !== "object")){
                system.error(method + "Argument 'initial' missing " +
                             "or it isn't of type 'object'.");
            }
            var header;
            if("header" in initial){
                if(typeof initial.header === "string"){
                    header = initial.header;
                }
                else{
                    system.error(method + "Optional argument 'initial.header' submitted " +
                                 "but it isn't of type 'string'.");
                }
            }
            if (!("message" in initial) || (typeof initial.message !== "string")) {
                system.error(method + "Argument 'initial.message' missing " +
                             "or it isn't of type 'string'.");
            }
            return {
                header: (header ? header : "leftWING"),
                content: function(container){
                    return container.addChild("div").addHtml(initial.message);
                },
                buttons: [
                    {
                        label: "OK",
                        keyCode: [27, 13],
                        onClick: "close",
                        onClose: function(event){
                            if("onClose" in initial){
                                if (typeof initial.onClose !== "function") {
                                    system.error("system.dialogs.message: " +
                                                 "Optional Argument 'initial.onClose' submitted " +
                                                 "but it isn't of type 'function'.");
                                }
                                initial.onClose(event);
                            }
                        }
                        
                    }
                ]
            };
        },
        loginDialog: function(position){
            
            system.popup.dialog(position, {
                
                header: system.translate("{0} Login", system.application.label),
                content: system.insert.form(system.form.login()),
                buttons: [
                    {label: "yald", onClick: function(dialog, position){system.popup.loginDialog(position);}},
                    {label: system.translate("Cancel"), keyCode: 27, onClick: "close"},
                    {
                        label: system.translate("Login"), keyCode: 13,
                        onClick: "\\leftWING\\environment::login",
                        onSuccess: function(){
                            window.location.reload();
                        }
                    }
                ]
            });
        },
        changePasswordDialog: function(position){
            
            var header = system.translate("Change password for user {0}", system.session.user); 
            system.popup.dialog(position, {
                
                header: header,
                content: system.insert.form(system.form.changePassword()),
                buttons: [
                    {label: "html", onClick: function(dialog, position){system.popup.htmlStructureDialog(position);}},
                    {label: system.translate("Cancel"), keyCode: 27, onClick: "close"},
                    {
                        label: system.translate("OK"), keyCode: 13,
                        onClick: "\\leftWING\\environment::changePassword",
                        onSuccess: function(){
                            system.popup.errorDialog(
                                position,
                                header,
                                system.translate("Password for user {0} successfully changed", system.session.user)
                            );
                        }
                    }
                ]
            });
        }
    };
    
    system.insert = {
        popup: function(getSections, menuItem){ // getSection(), [menuItem]
            
            var method = "leftWING.insert.popup: ";
            
            if(system.activePopup){
                system.activePopup.destroy();
            }
            
            // Creating DOM elements
            // ---------------------
            var popup = system.insert.node(document.body, "div", "leftwing-popup");
            popup.style.position = "absolute";
            if(menuItem){
                if(!(menuItem instanceof Node)){
                    throw method + "Optional argument 'menuItem' submitted " +
                            "but it isn't instance of 'Node'.";
                }
                popup.menuItem = menuItem
            }
            
            if(typeof getSections != "function") {
                throw method + "Argument 'getSections' isn't of type 'function'.";
            }
            var sections = getSections();
            if(!(sections instanceof Array)){
                throw method + "Argument function 'getSections' doesn't return an array.";
            }
            for(var i = 0; i < sections.length; i++){
                var items = sections[i];
                var sectionList = system.insert.node(popup, 'ol');
                for(var j = 0; j < items.length; j++){
                    var paramter = method + ": argument 'sections[" + i + "][" + j + "]': ";
                    var item = system.insert.node(sectionList, 'li',
                        "leftwing-no-text-selection leftwing-no-wrap leftwing-click-target");
                    if(!items[j].label || (typeof items[j].label != "string")){
                        throw parameter + "Key 'label' isn't of type 'string'.";
                    }
                    item.appendTextNode(items[j].label);
                    if(items[j].onClick){
                        if(items[j].onClick){
                            if(typeof items[j].onClick != "function"){
                                throw paramter + "Optional key 'onClick' submitted but it isn't of type 'function'.";
                            }
                            item.onClick = items[j].onClick;
                        }
                    }
                    if(items[j].grayed)
                        system.addClass(item, 'grayed');
                    if(items[j].data){
                        item.data = items[j].data;
                    }
                }
            };
            
            
            // Initializing the popup
            // -----------------------
            system.activePopup = popup;
            popup.selectedItem = undefined;
            
            
            
            // Item highlighting
            // -----------------
            popup.selectItem = function(item){
                
                if(item == popup.selectedItem)
                    return;
                if(popup.selectedItem)
                    system.removeClass(popup.selectedItem, 'highlighted');
                popup.selectedItem = item;
                system.addClass(popup.selectedItem, 'highlighted');
            };
            popup.selectNextItem = function(){
            
                if(!popup.selectedItem)
                    popup.selectItem(popup.firstChild.firstChild);
                else if(popup.selectedItem.nextSibling)
                    popup.selectItem(popup.selectedItem.nextSibling);
                else if(popup.selectedItem.parentNode.nextSibling)
                    popup.selectItem(popup.selectedItem.parentNode.nextSibling.firstChild);
                else
                    popup.selectItem(popup.firstChild.firstChild);
            };
            popup.selectPreviousItem = function(){
                
                if(!popup.selectedItem)
                    popup.selectItem(popup.lastChild.lastChild);
                else if(popup.selectedItem.previousSibling)
                    popup.selectItem(popup.selectedItem.previousSibling);
                else if(popup.selectedItem.parentNode.previousSibling)
                    popup.selectItem(popup.selectedItem.parentNode.previousSibling.lastChild);
                else
                    popup.selectItem(popup.lastChild.lastChild);
            };
            
            
            // Event handling
            // --------------
            popup.itemClickedHandler = function(event){
                
                var item = popup.selectedItem;
                if(!item){
                    return;
                }
                var position = {};
                position = ((event.type == 'keydown') ?
                    item.getPosition() : 
                    {x: event.clientX, y: event.clientY});
                popup.destroy();
                if(item.onClick && !item.grayed)
                    item.onClick(position, item.data);                
            };
            
            popup.keyDownHandler = function(event){
                
                if(event.keyCode == 9){
                    event.preventDefault();
                    event.stopPropagation();
                }
                else if(event.keyCode == 27)
                    popup.destroy();
                else if(event.keyCode == 13)
                    popup.itemClickedHandler(event);
                else if(event.keyCode == 38)
                    popup.selectPreviousItem();
                else if(event.keyCode == 40)
                    popup.selectNextItem();
            };
            
            popup.mouseOverHandler = function(event){

                if(event.target.parentNode.parentNode != popup)
                    return;
                popup.selectItem(event.target);
            };
            
            
            popup.mouseUpHandler = function(event){
                event.preventDefault();
                if(event.target.parentNode.parentNode == popup)
                    popup.itemClickedHandler(event);
            };

           
            popup.destroy = function(){
            
                window.removeEventListener("mousedown", popup.destroy, false);
                window.removeEventListener("keydown", popup.keyDownHandler, true);
                window.removeEventListener("mouseup", popup.mouseUpHandler, false);
                document.body.removeChild(popup);
                system.activePopup = undefined;
            };

            window.addEventListener("mousedown", popup.destroy, false);
            window.addEventListener("keydown", popup.keyDownHandler, true);
            window.addEventListener("mouseup", popup.mouseUpHandler, false);
            popup.addEventListener("mousedown", function(event){event.stopPropagation();}, true);
            popup.addEventListener("mouseover", popup.mouseOverHandler, false);
            
            return popup;
        },
        menu: function(initial){
            
            var method = "system.insert.menu: ";
            
            
            // Validating argument 'initial'
            // ----------------------------
            if(!initial){
                throw method + "Argutent 'initial' missing.";
            }
            
            return function(location){
                
                
                // Creating DOM elements
                // ---------------------
                var container = system.insert.node(location, 'ol');
                if(!initial.items || !(initial.items instanceof Array)){
                    throw method + "Argument 'initial.items' missing or it isn't instance of 'Array'.";
                }
                var items = [];
                for(var i = 0; i < initial.items.length; i++){
                    var parameter = method + " parameter 'initial.items[" + i + "]': ";
                    if(!initial.items[i].label || (typeof initial.items[i].label != "string")){
                        throw parameter + "Argument 'label' isn't of type 'string'.";
                    }
                    var item = system.insert.node(container, 'li',
                            "leftwing-no-text-selection left-wing-no-wrap leftwing-link");
                    if(initial.keyboardHandling){
                        item.innerHTML = '<span>' + initial.items[i].label[0] + '</span>' + initial.items[i].label.substr(1);
                    }
                    else{
                        item.appendTextNode(initial.items[i].label);
                    }
                    if(initial.items[i].title){
                        if(typeof initial.items[i].title != "string"){
                            throw parameter + "Optional argument 'title' submitted but it isn't of type 'string'.";
                        }
                        item.setAttribute("title", initial.items[i].title);
                    }
                    if(initial.items[i].onPopup){
                        if(typeof initial.items[i].onPopup != "function"){
                            throw parameter + "optional argument 'onPopup' submitted " +
                                                "but it isn't of type 'function'.";
                        }
                        if(initial.onClick) {
                            parameter + "Argument 'onPopup' submitted. 'onClick' not allowed.";
                        }
                        item.onPopup = initial.items[i].onPopup;
                        item.onClick = undefined;
                    }
                    else if(initial.items[i].onClick){
                        if(typeof initial.items[i].onClick != "function"){
                            throw parameter + "Optional argument 'onClick submitted " +
                                            "but it isn't of type 'function'.";
                        }
                        item.onPopup = undefined;
                        item.onClick = initial.items[i].onClick;
                    }
                    else{
                        throw parameter + "Neither argument 'onPopup' nor argument 'onClick' submitted.";
                    }
                    items.push(item);
                }
                
                container.popup = function(item){
                    
                    var position = item.getPosition();
                    
                    if(item.onClick){
                        if(system.activePopup){
                            system.activePopup.destroy();
                        }
                        item.onClick(position);
                    }
                    else{
                        if (system.activePopup &&
                            system.activePopup.menuItem &&
                            system.activePopup.menuItem == item) {
                            system.activePopup.destroy();
                        }
                        else{
                            position.y += item.offsetHeight;
                            var popup = system.insert.popup(item.onPopup, item);
                            if (initial.popupAlign && initial.popupAlign == "right"){
                                position.x = position.x + item.offsetWidth - popup.offsetWidth;
                            }
                            system.positionToMouse(popup, {clientX: position.x, clientY: position.y});
                        }
                    }
                }
                
                container.addEventListener('mousedown', function(event){
                    event.stopPropagation();
                    if(event.target.parentNode == container)
                        container.popup(event.target);
                });
                
                
                if(initial.keyboardHandling){
                    window.addEventListener('keydown', function(event){
                        if(event.altKey){
                            if(system.activePopup)
                                system.activePopup.destroy();
                            var key = String.fromCharCode(event.keyCode).toLowerCase();
                            //alert(items[0].innerHTML);
                            for(var i = 0; (i < items.length) && (items[i].firstChild.innerHTML[0].toLowerCase() != key); i++);
                            if(i < initial.items.length){
                                event.preventDefault();
                                container.popup(items[i]);
                            }
                        }
                    });
                }
                
                container.addEventListener('contextmenu', function(event){
                    event.preventDefault();
                });
                return container;
            }
        },
        menubar: function(menues){
            
            var method = "system.menuebar: ";
            if(!menues || (typeof menues != "object")){
                throw method + "Argument 'menues' missing or it isn't of type 'object'.";
            }
            
            return function(location){
                
                if(!location.tagName || (location.tagName.toLowerCase() != "ol")){
                    throw method + "Menu bars can only be inserted in ol tags.";
                }
                
                for(var style in menues){
                    if(typeof menues[style] != "object"){
                        throw method + "Argument menues[" + style + "] istn't of type 'object'.";
                    }
                    var container = system.insert.node(location, "li");
                    var menu = system.insert.menu(menues[style])(container);
                    system.addClass(menu, style);
                }
            }
        },
        
    };
    system.system = {
        menu: function(initial){
            
            if(!initial){
                initial = {
                    keyboardHandling: false,
                    popupAlign: "left"
                };
            }
            
            var menu = {
                popupAlign: (initial.popupAlign ? initial.popupAlign : "right"),
                keyboardHandling: (initial.keyboardHandling ? initial.keyboardHandling : false),
            };
                
            if(system.session.user == "guest"){
                if(initial.onLogin){
                    
                    if(typeof initial.onLogin != "function"){
                        throw "leftWING.system.menu: Optional argument 'onLogin' submitted " +
                        "but it isn't of type 'fucntion'";
                    }

                    menu.items = [
                        {
                            label: system.translate("Login"),
                            onClick: initial.onLogin
                        }
                        
                    ];
                }
                else{
                    menu.items = [];
                }
            }
            else{
                menu.items = [
                    {
                        label: system.session.user,
                        title: system.translate('Click here to change your settings.'),
                        onPopup: function(){
                            return [[
                                {
                                    label: system.translate("Logout"),
                                    onClick: function(position, data){
                                        system.startWaiting();
                                        system.request(
                                            "\\leftWING\\environment::logout",
                                            null,
                                            function(response){
                                                system.stopWaiting();
                                                if(response.error.code != 0){
                                                    system.popup.errorDialog(
                                                        position,
                                                        system.translate("{0} Logout", system.application.name),
                                                        response.error.message
                                                    )
                                                }
                                                else{
                                                    window.location.reload();
                                                }
                                            }
                                        );
                                    }
                                },
                                {
                                    label: system.translate("Change Login"),
                                    onClick: function(position, data){system.popup.loginDialog(position);}
                                }
                            ],
                            [
                                {
                                    label: system.translate("Change password"),
                                    onClick: function(position, data){
                                        system.popup.changePasswordDialog(position);}
                                } 
                            ]];
                        }
                    }
                ];
            }
            menu.items.push(
                {
                    label: system.session.language.label,
                    title: 'Click here to select another language for this user interface',
                    onPopup: function(){
                        var items = [];
                        for(var i = 0; i < system.availableLanguages.length; i++){
                            var language = system.availableLanguages[i];
                            if(language.id != system.session.language.id){
                                
                                items.push({
                                    label: language.label,
                                    onClick: function(position, id){
                                        system.startWaiting();
                                        system.request(
                                            '\\leftWING\\environment::changeLanguage',
                                            {l:id},
                                            function(response){
                                                system.stopWaiting();   
                                                if(response.error.code != 0){
                                                    system.popup.errorDialog(
                                                        position,
                                                        system.translate("Cange Language"),
                                                        response.error.message
                                                    );
                                                }
                                                else{
                                                    system.initialize();
                                                }
                                            }
                                        );
                                    },
                                    data: language.id
                                });
                            }
                        }
                        return [items];
                    }
                }
            );
            //menu.items.push(
            //    {
            //        label: "?",
            //        title: "About the system",
            //        onPopup: function(position){
            //            return [[
            //                {
            //                    label: "HTM Structure",
            //                    onClick: system.popup.htmlStructureDialog
            //                }
            //            ]];
            //        }
            //    }
            //);
            return menu;
                
        }
    };
    window.addEventListener("resize", function(event){
        if (system.activePopup) {
            system.activePopup.destroy();
        }
    });
    window.addEventListener("load", function(event){
        leftWING.initialize();
    });
};












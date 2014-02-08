String.prototype.words = function(){
    
    return this.trim().split(/\s+/);
}
Array.prototype.contain = function(item){
    
    for(var i = 0; i < this.length && this[i] != item; i++);
    return (i < this.length);
}
Array.prototype.sum = function(){
    
    for(var sum  = 0, i = 0; i < this.length; sum += this[i++]);
    return sum;
}
Node.prototype.appendTextNode = function(text){
    this.appendChild(document.createTextNode(text));
}
Node.prototype.disableTextSelection = function(){
    
    this.addClass('no-text-selection');
}
Node.prototype.insertElement = function(nextSibling, tagName, id, style){
    
    var element = document.createElement(tagName, id);
    if(id)
        element.setAttribute('id', id);
    if(nextSibling)
        this.insertBefore(element, nextSibling);
    else
        this.appendChild(element);
    if(style)
        element.addStyle(style);
    return element;
}
Node.prototype.appendImage = function (src, dimensions, alt, id){

    var img = this.appendElement('img', id);
    img.src = src;
    if(dimensions.width)
        img.width = dimensions.width;
    if(dimensions.height)
        img.height = dimensions.height;
    img.alt = alt;
    return img;
}
Node.prototype.getPosition = function(){
    
    // We assume that the 'offsetLeft' and 'offsetTop'
    // properties of a node that has slready been
    // removed from the tree are correctly set to 0.
    
    var container = this;
    var left = 0;
    var top = 0;
    
    do{
        left += container.offsetLeft;
        top += container.offsetTop;
    }while((container = container.offsetParent));
    return {'x': left, 'y': top};
}
Node.prototype.containsPosition = function(pos){
    
    thispos = this.getPosition();
    return (thispos.y <= pos.y && pos.y < thispos.y + this.offsetHeight &&
            thispos.x <= pos.x && pos.x < thispos.x + this.offsetWidth);
    
}
Node.prototype.isOrIsParentOf = function(node){
    var parent = node;
    while(parent && parent != this && parent.parentNode){
        parent = parent.parentNode;
    }
    return parent == this;
}






















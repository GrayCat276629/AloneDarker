var scriptName = "FishGuard";
var scriptVersion = 1.0;
var scriptAuthor = "AloneDarker | DevTeaming(By KRCat)";
var C09PacketHeldItemChange = Java.type("net.minecraft.network.play.client.C09PacketHeldItemChange");

function FishGuard() {
    this.getName = function() { return "FishGuard"; };
    this.getDescription = function() { return "FishGuard"; };
    this.getCategory = function() { return "Misc"; };
    
    // Настройки
    var radius = 2.0; // Радиус проверки игроков вокруг крючка
    var messageText = "%player% | [FishGuard]"; // Сообщение, которое будет отправлено в чат при обнаружении игрока
    var whitelist = ["", ""]; // Список игроков, которых не нужно проверять (можно добавить свои ники) 
    var delay = 5000; // Задержка между срабатываниями (в миллисекундах) чтобы не спамить чат и не кикнуться
    
    // Внутренние переменные
    var switched = false; // Флаг, указывающий, был ли переключен слот
    var savedSlot = -1; // Сохраненный слот, на который был переключен игрок
    var lastTriggerTime = 0; // Время последнего срабатывания (для задержки)

    this.onUpdate = function() {
        if (!mc.thePlayer || !mc.theWorld) return;
        
        var held = mc.thePlayer.getHeldItem();
        if (!held) return;
        
        var name = held.getItem().getUnlocalizedName();
        if (name.indexOf("fishing_rod") === -1 && name.indexOf("fishingRod") === -1) {
            if (switched) {
                mc.thePlayer.inventory.currentItem = savedSlot;
                mc.getNetHandler().addToSendQueue(new C09PacketHeldItemChange(savedSlot));
                switched = false;
            }
            return;
        }
        
        var bobber = null;
        var entities = mc.theWorld.loadedEntityList;
        for (var i = 0; i < entities.size(); i++) {
            var e = entities.get(i);
            if (!e) continue;
            var cn = e.getClass().getSimpleName();
            if (cn.indexOf("FishHook") !== -1 || cn.indexOf("Bobber") !== -1) {
                bobber = e;
                break;
            }
        }
        
        if (!bobber) {
            if (switched) {
                mc.thePlayer.inventory.currentItem = savedSlot;
                mc.getNetHandler().addToSendQueue(new C09PacketHeldItemChange(savedSlot));
                switched = false;
            }
            return;
        }
        
        var players = mc.theWorld.playerEntities;
        var intruder = null;
        
        for (var j = 0; j < players.size(); j++) {
            var p = players.get(j);
            if (p == mc.thePlayer) continue;
            if (p.getName() == mc.thePlayer.getName()) continue;
            
            var isWhitelisted = false;
            for (var k = 0; k < whitelist.length; k++) {
                if (whitelist[k] == p.getName()) {
                    isWhitelisted = true;
                    break;
                }
            }
            if (isWhitelisted) continue;
            
            if (bobber.getDistanceToEntity(p) <= radius) {
                intruder = p;
                break;
            }
        }
        
        var currentTime = java.lang.System.currentTimeMillis();
        
        if (intruder) {
            if (!switched && (currentTime - lastTriggerTime >= delay)) {
                savedSlot = mc.thePlayer.inventory.currentItem;
                lastTriggerTime = currentTime;
                
                var msg = messageText.replace("%player%", intruder.getName());
                mc.thePlayer.sendChatMessage(msg);
                
                for (var slot = 0; slot < 9; slot++) {
                    if (slot == savedSlot) continue;
                    var item = mc.thePlayer.inventory.getStackInSlot(slot);
                    if (!item) {
                        mc.thePlayer.inventory.currentItem = slot;
                        mc.getNetHandler().addToSendQueue(new C09PacketHeldItemChange(slot));
                        switched = true;
                        break;
                    }
                    var n = item.getItem().getUnlocalizedName();
                    if (n.indexOf("fishing_rod") === -1 && n.indexOf("fishingRod") === -1) {
                        mc.thePlayer.inventory.currentItem = slot;
                        mc.getNetHandler().addToSendQueue(new C09PacketHeldItemChange(slot));
                        switched = true;
                        break;
                    }
                }
            }
        } else {
            if (switched) {
                mc.thePlayer.inventory.currentItem = savedSlot;
                mc.getNetHandler().addToSendQueue(new C09PacketHeldItemChange(savedSlot));
                switched = false;
                savedSlot = -1;
            }
        }
    };
}

var fishGuard = new FishGuard();

function onEnable() {
    moduleManager.registerModule(fishGuard);
}

function onDisable() {
    moduleManager.unregisterModule(fishGuard);
}

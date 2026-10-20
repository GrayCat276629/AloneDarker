var script = registerScript({
    name: "FishGuard",
    version: "1.0.0",
    authors: ["AloneDarker | DevTeaming(By KRCat)"]
});

script.registerModule({
    name: "FishGuard",
    category: "Misc",
    description: "FishGuard",
    settings: {
        range: Setting.float({
            name: "Range",
            default: 2.0, 
            range: [1.0, 10.0]
        }),
        message: Setting.text({
            name: "Message",
            default: "%player% | [FishGuard]"
        }),
        whitelist: Setting.textArray({
            name: "Whitelist",
            default: []
        }),
        delay: Setting.int({
            name: "Delay",
            default: 5000,
            range: [0, 10000],
            suffix: "ms"
        })
    }
}, function(module) {
    var switched = false;
    var savedSlot = -1;
    var lastTriggerTime = 0;

    module.on("playerTick", function() {
        if (!mc.player || !mc.level) return;

        var held = mc.player.getMainHandItem();
        if (!held) return;

        var itemName = held.getItem().getDescriptionId();
        if (itemName.indexOf("fishing_rod") === -1) {
            if (switched) {
                mc.player.getInventory().selected = savedSlot;
                switched = false;
            }
            return;
        }

        var bobber = null;
        var entities = mc.level.entitiesForRendering();
        var iterator = entities.iterator();
        while (iterator.hasNext()) {
            var e = iterator.next();
            if (!e) continue;
            var cn = e.getClass().getSimpleName();
            if (cn.indexOf("FishHook") !== -1 || cn.indexOf("Bobber") !== -1) {
                bobber = e;
                break;
            }
        }

        if (!bobber) {
            if (switched) {
                mc.player.getInventory().selected = savedSlot;
                switched = false;
            }
            return;
        }

        var players = mc.level.players();
        var intruder = null;
        var radius = module.settings.range.get();

        for (var j = 0; j < players.size(); j++) {
            var p = players.get(j);
            if (p == mc.player) continue;
            if (p.getName().getString() == mc.player.getName().getString()) continue;

            var isWhitelisted = false;
            var whitelist = module.settings.whitelist.get();
            for (var k = 0; k < whitelist.length; k++) {
                if (whitelist[k] == p.getName().getString()) {
                    isWhitelisted = true;
                    break;
                }
            }
            if (isWhitelisted) continue;

            if (bobber.distanceTo(p) <= radius) {
                intruder = p;
                break;
            }
        }

        var currentTime = Date.now();

        if (intruder) {
            if (!switched && (currentTime - lastTriggerTime >= module.settings.delay.get())) {
                savedSlot = mc.player.getInventory().selected;
                lastTriggerTime = currentTime;

                var msg = module.settings.message.get();
                msg = msg.replace("%player%", intruder.getName().getString());
                mc.player.chat(msg);

                var inventory = mc.player.getInventory();
                for (var slot = 0; slot < 9; slot++) {
                    if (slot == savedSlot) continue;
                    var item = inventory.getItem(slot);
                    if (!item) {
                        inventory.selected = slot;
                        switched = true;
                        break;
                    }
                    var n = item.getItem().getDescriptionId();
                    if (n.indexOf("fishing_rod") === -1) {
                        inventory.selected = slot;
                        switched = true;
                        break;
                    }
                }
            }
        } else {
            if (switched) {
                mc.player.getInventory().selected = savedSlot;
                switched = false;
                savedSlot = -1;
            }
        }
    });
});

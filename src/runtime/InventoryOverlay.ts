import Phaser from "phaser";
import type {InventoryState} from "./LootInventory";
export function createInventoryOverlay(scene:Phaser.Scene){
 const root=scene.add.container(320,200).setScrollFactor(0).setDepth(100).setVisible(false);
 root.add(scene.add.rectangle(0,0,520,300,0x0b0b0f,.96).setStrokeStyle(2,0xf4c430));
 root.add(scene.add.text(-235,-132,"INVENTÁRIO",{fontFamily:"Inter",fontSize:"22px",color:"#f4c430"}));
 root.add(scene.add.text(-235,-102,"I ou ESC para fechar",{fontFamily:"Inter",fontSize:"12px",color:"#f4f6f9"}));
 const list=scene.add.container(-220,-65);root.add(list);
 return {
  root,
  render:(state:InventoryState)=>{
   list.removeAll(true);
   state.items.forEach((item,i)=>{const x=(i%4)*110,y=Math.floor(i/4)*70;
    list.add(scene.add.rectangle(x,y,96,58,0x17171d,.95).setOrigin(.5));
    list.add(scene.add.text(x-42,y-18,item.id,{fontFamily:"Inter",fontSize:"11px",color:"#f4f6f9"}));
    list.add(scene.add.text(x+26,y+7,"×"+item.quantity,{fontFamily:"Inter",fontSize:"14px",color:"#f4c430"}));
   });
   if(state.items.length===0)list.add(scene.add.text(0,0,"Inventário vazio",{fontFamily:"Inter",fontSize:"15px",color:"#f4f6f9"}));
  },
  toggle:()=>root.setVisible(!root.visible),
  close:()=>root.setVisible(false)
 };
}
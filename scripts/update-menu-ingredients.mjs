import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

// Preview by default. Apply only to the explicitly named restaurant.
const slug = process.argv.find(arg => arg.startsWith('--restaurant='))?.split('=')[1];
if (!slug) throw new Error('Informe --restaurant=slug; acrescente --apply para salvar.');
const apply = process.argv.includes('--apply');
const compositions = JSON.parse(fs.readFileSync(new URL('../prisma/data/menu-ingredients.json', import.meta.url), 'utf8'));
const db = new PrismaClient();
try {
  const restaurant = await db.restaurant.findUniqueOrThrow({where:{slug},select:{id:true}});
  const products = await db.product.findMany({where:{restaurantId:restaurant.id},select:{id:true,slug:true,name:true,ingredients:true}});
  const changes = products.filter(p => compositions[p.slug] && compositions[p.slug] !== p.ingredients);
  const missing = products.filter(p => !compositions[p.slug]);
  if (missing.length) throw new Error('Produtos sem composição revisada: '+missing.map(p=>p.slug).join(', '));
  console.log(JSON.stringify({restaurant:slug,reviewed:products.length,changes:changes.length,apply}));
  if (apply && changes.length) {
    // Keep a local recovery copy before the transaction; never overwrite previous runs.
    fs.mkdirSync('security-audit',{recursive:true});
    fs.writeFileSync(`security-audit/menu-ingredients-before-${Date.now()}.json`,JSON.stringify({restaurantId:restaurant.id,products:changes},null,2),{flag:'wx'});
    await db.$transaction(async tx => {
      const actor=JSON.stringify({name:'Henry — revisão do cardápio',role:'ADMIN',restaurantId:restaurant.id});
      await tx.$executeRaw`SELECT set_config('app.audit_actor', ${actor}, true)`;
      for(const p of changes){
        const result=await tx.product.updateMany({where:{id:p.id,restaurantId:restaurant.id,ingredients:p.ingredients},data:{ingredients:compositions[p.slug]}});
        if(result.count!==1) throw new Error('Cadastro alterado durante a revisão: '+p.slug);
      }
    },{timeout:60000});
  }
  const saved=await db.product.findMany({where:{restaurantId:restaurant.id},select:{slug:true,ingredients:true}});
  if(apply && saved.some(p=>p.ingredients!==compositions[p.slug])) throw new Error('Falha na conferência após salvar');
  console.log(apply?'Composições conferidas no banco.':'Prévia concluída; nenhum dado alterado.');
} finally {await db.$disconnect();}

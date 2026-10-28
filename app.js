(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => value === null ? 'Sob consulta' : new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format(value);
  const dateLabel = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'}) : 'A combinar';
  const localDate = offset => { const date = new Date(); date.setDate(date.getDate()+offset); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
  const products = [
    {id:'bouquet',name:'Flores do dia',category:'flores',categoryLabel:'Bouquets da estação',image:'assets/buque-principal.jpg',description:'Um mix de flores, embalagem kraft e cartão. Um jeito inteiro de dizer carinho.',badge:'O CARINHO DE TODO DIA',sizes:[{name:'Bouquet P',price:228},{name:'Bouquet M',price:320}],available:true},
    {id:'personal',name:'Seu toque especial',category:'presentes',categoryLabel:'Presentes personalizados',image:'assets/caixa-presente.jpg',description:'Flores em caixa chapéu, com nome ou inicial na embalagem e cartão escrito à mão.',badge:'DO SEU JEITO',sizes:[{name:'Caixa P',price:189},{name:'Caixa M',price:269}],available:true},
    {id:'kit',name:'Flores & um brinde',category:'presentes',categoryLabel:'Composições especiais',image:'assets/kit-presente.jpg',description:'Uma inspiração para celebrar com flores e complementos escolhidos juntos.',badge:'PARA CELEBRAR',sizes:[{name:'Kit Celebração',price:349},{name:'Kit Especial',price:459}],available:true},
    {id:'basic',name:'Pequenos gestos',category:'pequenos',categoryLabel:'Linha Basic',image:'assets/pequenos-gestos.jpg',description:'Flores em vidro reciclado, com a delicadeza dos pequenos detalhes.',badge:'DELICADEZA QUE FICA',sizes:[{name:'Basic One',price:95},{name:'Basic Two',price:155}],available:true}
  ];
  const stages = ['A confirmar','Em preparação','Pronto','Em entrega','Concluído','Cancelado'];
  let orders = [
    {id:'DEMO-1042',buyer:'Marina (exemplo)',recipient:'Clara',phone:'Não informado · exemplo',productName:'Flores do dia',size:'Bouquet M',price:320,delivery:'Entrega',date:localDate(1),time:'Manhã · 9h às 12h',address:'Endereço fictício · Centro',preferences:'Tons claros. Evitar rosas vermelhas.',cardMessage:'Para deixar seu novo ciclo ainda mais bonito!',personalization:'Clara',occasion:'Aniversário',status:'A confirmar',reference:'Confirmar endereço antes da entrega.'},
    {id:'DEMO-1041',buyer:'Rafael (exemplo)',recipient:'Beatriz',phone:'Não informado · exemplo',productName:'Pequenos gestos',size:'Basic Two',price:155,delivery:'Retirada',date:localDate(0),time:'Tarde · 13h às 17h',address:'Retirada na loja',preferences:'Flores coloridas.',cardMessage:'Obrigado por estar sempre por perto.',personalization:'',occasion:'Agradecimento',status:'Em preparação'},
    {id:'DEMO-1040',buyer:'Camila (exemplo)',recipient:'Helena',phone:'Não informado · exemplo',productName:'Flores do dia',size:'Bouquet P',price:228,delivery:'Entrega',date:localDate(0),time:'Tarde · 13h às 17h',address:'Endereço fictício · Jardim das Flores',preferences:'Sem preferência.',cardMessage:'Um abraço em forma de flores.',personalization:'H',occasion:'Um carinho sem data',status:'Em entrega'},
    {id:'DEMO-1039',buyer:'Lucas (exemplo)',recipient:'Sofia',phone:'Não informado · exemplo',productName:'Flores & um brinde',size:'Kit Celebração',price:349,delivery:'Retirada',date:localDate(0),time:'Manhã · 9h às 12h',address:'Retirada na loja',preferences:'Composição em tons de rosa.',cardMessage:'Que venham muitas conquistas!',personalization:'',occasion:'Outra ocasião',status:'Concluído'}
  ];
  let filter = 'all', selectedProduct = products[0], selectedSize = 0, step = 1, lastOrder = null, simulatedCount = 0, toastTimer, activeDraft = false;
  const dialog = $('#order-dialog');
  const orderScroller = $('.order-layout', dialog);
  const form = $('#order-form');
  $('#dialog-title').tabIndex = -1;
  form.noValidate = true;
  $('#step-3 .review-notice').after($('#pix-template').content.cloneNode(true));
  $('.copy-pix').addEventListener('click', async event => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText('30499684000189');
      button.textContent = 'Chave copiada ✓';
    } catch {
      const field = $('.pix-key');
      field.focus();
      field.select();
      button.textContent = 'Chave selecionada: use Ctrl+C';
    }
  });

  function toast(message) { clearTimeout(toastTimer); const notice=$('#toast'); (document.querySelector('dialog[open]')||document.body).append(notice); notice.textContent = message; notice.hidden = false; toastTimer=setTimeout(()=>notice.hidden=true,4200); }
  function closeDialog(target) { target.close(); }
  $$('.close-dialog').forEach(button => button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));
  $$('dialog').forEach(target => target.addEventListener('click',event => { if(event.target === target){ const box=target.getBoundingClientRect(); if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom) closeDialog(target); } }));

  function showView(view) {
    $('#store-view').hidden = view !== 'store'; $('#admin-view').hidden = view !== 'admin';
    $$('[data-view]').forEach(button=>{ const active=button.dataset.view===view; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
    if(view==='admin')renderAdmin();
    window.scrollTo({top:0,behavior:'instant'});
  }
  $$('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));

  function renderProducts() {
    const list=products.filter(product=>filter==='all'||product.category===filter);
    $('#results-count').textContent=`${list.length} ${list.length===1?'forma':'formas'} de surpreender`;
    $('#product-grid').innerHTML=list.map((product,index)=>`<article class="product-card ${product.available?'':'disabled-product'}" style="animation-delay:${index*45}ms"><button class="product-image" data-product="${product.id}" aria-label="Conhecer ${esc(product.name)}" ${product.available?'':'disabled'}><img src="${product.image}" alt="${esc(product.name)}, foto ilustrativa" loading="lazy"><span class="badge">${product.available?product.badge:'PAUSADO NA PRÉVIA'}</span><span class="round-arrow" aria-hidden="true">↗</span></button><div class="product-info"><span class="category">${product.categoryLabel}</span><h3>${product.name}</h3><p>${product.description}</p><div class="product-bottom"><span class="product-price">${product.sizes[0].price!==null?'<small>a partir de</small>':''}${money(product.sizes[0].price)}</span><button data-product="${product.id}" ${product.available?'':'disabled'}>${product.sizes[0].price===null?'Personalizar':'Escolher'} ↗</button></div></div></article>`).join('');
  }
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;$$('[data-filter]').forEach(other=>{other.classList.toggle('active',other===button);other.setAttribute('aria-pressed',String(other===button));});renderProducts();}));
  document.addEventListener('click',event=>{const button=event.target.closest('[data-product]');if(button)openOrder(button.dataset.product);});
  $$('[data-inspiration]').forEach(button=>button.addEventListener('click',()=>openOrder('personal',`Inspiração do portfólio: ${button.dataset.inspiration}.`,button.dataset.image)));

  function openOrder(productId, preferences='', referenceImage='') {
    const product=products.find(item=>item.id===productId);
    if(!product || !product.available){toast('Esse presente está pausado nesta prévia. Escolha outro no catálogo.');return;}
    selectedProduct=product;selectedSize=0;step=1;form.reset();activeDraft=true;
    $$('input,textarea,select', form).forEach(clearFieldError);
    $('.copy-pix').textContent='Copiar chave Pix ↗';
    form.elements.cardMessage.disabled=false;form.elements.phone.setCustomValidity('');
    form.elements.preferences.value=preferences;
    form.elements.date.min=localDate(0);form.elements.date.value=localDate(1);
    $('#dialog-image').src=referenceImage||product.image;$('#dialog-image').alt=product.name;
    $('#dialog-photo-title').textContent=product.name;
    $('#size-options').innerHTML=product.sizes.map((size,index)=>`<label class="size-choice"><input type="radio" name="size" value="${index}" ${index===0?'checked':''}><strong>${size.name}</strong><small>${money(size.price)}</small></label>`).join('');
    $('legend', $('#step-1')).textContent=product.sizes.length>1?'Escolha o tamanho':'Sua composição';
    $('#order-success').hidden=true;form.hidden=false;$('.steps').hidden=false;$('#dialog-title').hidden=false;$('#dialog-subtitle').hidden=false;
    updateDelivery();updatePrice();renderStep();
    dialog.showModal();orderScroller.scrollTop=0;
  }
  function updatePrice(){
    $('#order-price').textContent=money(selectedProduct.sizes[selectedSize].price);
    $('.order-total small').textContent=form.elements.delivery.value==='Entrega'?'Frete a confirmar':'Retirada · sem frete';
  }
  form.addEventListener('change',event=>{
    if(event.target.name==='size'){selectedSize=Number(event.target.value);updatePrice();}
    if(event.target.name==='delivery'){updateDelivery();updatePrice();}
    if(event.target.name==='noCard'){form.elements.cardMessage.disabled=event.target.checked;}
  });
  form.addEventListener('input',event=>{if(event.target.matches('input,textarea,select'))clearFieldError(event.target);});
  function updateDelivery(){const delivery=form.elements.delivery.value==='Entrega';$('#address-fields').hidden=!delivery;form.elements.address.required=delivery;if(!delivery)clearFieldError(form.elements.address);}
  function renderStep(){
    $$('.order-step').forEach((element,index)=>element.hidden=index+1!==step);
    $$('.steps>span').forEach((element,index)=>{element.classList.toggle('active',index+1===step);if(index+1===step)element.setAttribute('aria-current','step');else element.removeAttribute('aria-current');});
    $('#back-step').hidden=step===1;
    $('#next-step').innerHTML=step===3?'Simular pedido <span aria-hidden="true">↗</span>':'Continuar <span aria-hidden="true">→</span>';
    $('#dialog-title').textContent=['Vamos deixar com a sua cara?','Para quem vai esse carinho?','Tudo pronto para florescer?'][step-1];
    $('#dialog-subtitle').textContent=['Conte um pouquinho. A gente cuida do resto.','Escolha como e quando gostaria de surpreender.','Confira os detalhes antes de simular o pedido.'][step-1];
    if(step===3)renderReview();
    orderScroller.scrollTop=0;
    if(dialog.open)$('#dialog-title').focus({preventScroll:true});
  }
  function draft(){
    const data=Object.fromEntries([...new FormData(form)].map(([key,value])=>[key,typeof value==='string'?value.trim():value]));
    const size=selectedProduct.sizes[selectedSize];
    return {...data,productName:selectedProduct.name,size:size.name,price:size.price,cardMessage:data.noCard?'Sem mensagem no cartão':data.cardMessage||'Sem mensagem informada',address:data.delivery==='Retirada'?'Retirada na loja':data.address};
  }
  function line(label,value){return `<div class="review-line"><span>${label}</span><strong>${esc(value||'Não informado')}</strong></div>`;}
  function renderReview(){
    const data=draft();
    $('#review-box').innerHTML=`<div class="review-product"><h3>${esc(data.productName)}</h3><p>${esc(data.size)} · ${money(data.price)}</p></div>${line('De / para',`${data.buyer} → ${data.recipient}`)}${line('Contato',data.phone)}${line('Ocasião',data.occasion)}${line(data.delivery,`${dateLabel(data.date)} · ${data.time}`)}${line('Local',data.address)}${data.reference&&data.delivery==='Entrega'?line('Referência',data.reference):''}${line('Embalagem',data.personalization||'Sem personalização solicitada')}${line('Preferências',data.preferences||'Curadoria da loja')}${line('Cartão',data.cardMessage)}`;
  }
  function clearFieldError(field){
    field.setCustomValidity('');
    field.removeAttribute('aria-invalid');
    const errorId=`error-${field.name}`;
    const error=document.getElementById(errorId);
    if(error)error.remove();
    if(field.getAttribute('aria-describedby')===errorId)field.removeAttribute('aria-describedby');
  }
  function validateDelivery(){
    const fields=$$('input,textarea,select',$('#step-2')).filter(field=>!field.disabled&&field.type!=='radio');
    fields.forEach(clearFieldError);
    const requiredMessages={buyer:'Informe seu nome.',recipient:'Informe quem vai receber.',address:'Informe o endereço da entrega.',date:'Escolha a data desejada.'};
    for(const field of fields){
      if(field.required&&!field.value.trim())field.setCustomValidity(requiredMessages[field.name]||'Preencha este campo.');
    }
    const phone=form.elements.phone, digits=phone.value.replace(/\D/g,'');
    if(digits.length<10||digits.length>13||!/^[+\d\s().-]+$/.test(phone.value))phone.setCustomValidity('Informe o telefone com DDD. Ex.: (11) 91234-5678.');
    const date=form.elements.date;
    date.min=localDate(0);
    if(date.validity.rangeUnderflow)date.setCustomValidity('Escolha hoje ou uma data futura.');
    let firstInvalid=null;
    for(const field of fields){
      if(field.checkValidity())continue;
      const error=document.createElement('span');
      error.id=`error-${field.name}`;error.className='field-error';error.textContent=field.validationMessage;
      field.closest('label').append(error);
      field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',error.id);
      firstInvalid ||= field;
    }
    if(firstInvalid){firstInvalid.focus();firstInvalid.scrollIntoView({block:'center',behavior:'instant'});return false;}
    return true;
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(step===2&&!validateDelivery())return;
    if(step<3){step++;renderStep();return;}
    if(!selectedProduct.available){toast('Este item foi pausado. Escolha outro presente.');return;}
    lastOrder=normalizeOrder({...draft(),id:nextOrderId(),status:'A confirmar'});
    addHistory(lastOrder,'Pedido recebido pela loja online na demonstração.');
    orders.unshift(lastOrder);simulatedCount++;activeDraft=false;persistDemo();
    $('#order-count').hidden=false;$('#order-count').textContent=simulatedCount;
    form.hidden=true;$('.steps').hidden=true;$('#dialog-title').hidden=true;$('#dialog-subtitle').hidden=true;$('#order-success').hidden=false;
    $('#success-summary').innerHTML=`<strong>${esc(lastOrder.id)}</strong><br>${esc(lastOrder.productName)} · ${esc(lastOrder.size)}<br>Para ${esc(lastOrder.recipient)} · ${dateLabel(lastOrder.date)}<br><span class="status-tag">Aguardando confirmação da loja</span>`;
    orderScroller.scrollTop=0;$('#see-in-panel').focus();renderAdmin();
  });
  $('#back-step').addEventListener('click',()=>{if(step>1){step--;renderStep();}});
  $('#fill-demo').addEventListener('click',()=>{
    form.elements.buyer.value='Alex (demonstração)';form.elements.phone.value='(00) 00000-0000';form.elements.recipient.value='Dani (demonstração)';form.elements.date.value=localDate(1);form.elements.address.value='Rua das Flores, 123 · Bairro Jardim · Cidade exemplo';form.elements.reference.value='Endereço fictício para visualizar o fluxo.';form.elements.phone.setCustomValidity('');
    $$('input,textarea,select', $('#step-2')).forEach(clearFieldError);
    $('#dialog-subtitle').textContent='Dados fictícios preenchidos. Você pode seguir para a revisão.';
  });
  $('#see-in-panel').addEventListener('click',()=>{dialog.close();showView('admin');showAdminTab('orders');});
  $('#keep-browsing').addEventListener('click',()=>dialog.close());
  $('#new-demo-order').addEventListener('click',()=>openStaffOrder());
  $('#my-order').addEventListener('click',()=>{if(activeDraft){dialog.showModal();$('#dialog-title').focus({preventScroll:true});}else if(lastOrder)showDetails(lastOrder.id,true);else openOrder('bouquet');});

  const storageKey = 'floricultura-demo-v2';
  const teamOptions = ['Equipe da loja','Atendimento','Produção','Entrega'];
  const timeStamp = () => new Date().toISOString();
  const momentLabel = value => new Date(value).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const amount = value => value === '' || value === null || value === undefined ? null : Math.round(Number(value)*100)/100;
  const cents = value => Math.round((value || 0)*100);
  function normalizeOrder(order) {
    order.freight = order.delivery === 'Retirada' ? 0 : (order.freight ?? null);
    order.payments ||= []; order.history ||= []; order.notes ||= ''; order.responsible ||= 'Equipe da loja';
    order.checklist ||= {flowers:false,card:false,packing:false};
    order.source ||= 'Loja online';
    return order;
  }
  const paymentSeed = (value,method='Pix') => [{amount:value,method,at:timeStamp(),voided:false}];
  orders.forEach(normalizeOrder);
  Object.assign(orders[0],{freight:15,payments:paymentSeed(100),responsible:'Atendimento',notes:'Confirmar a composição e o endereço com o cliente.'});
  Object.assign(orders[1],{payments:paymentSeed(155),responsible:'Produção',checklist:{flowers:true,card:true,packing:false}});
  Object.assign(orders[2],{freight:15,payments:paymentSeed(243),responsible:'Entrega',checklist:{flowers:true,card:true,packing:true}});
  Object.assign(orders[3],{price:390,payments:paymentSeed(390),checklist:{flowers:true,card:true,packing:true}});
  orders.push(normalizeOrder({id:'DEMO-1038',buyer:'Joana (exemplo)',recipient:'Lia (exemplo)',phone:'Não informado · exemplo',productName:'Pequenos gestos',size:'Basic One',price:95,delivery:'Retirada',date:localDate(0),time:'Fim de tarde · 17h às 18h',address:'Retirada na loja',status:'Pronto',preferences:'Flores amarelas.',cardMessage:'Um carinho para você!',responsible:'Atendimento',payments:paymentSeed(95),checklist:{flowers:true,card:true,packing:true}}));
  orders.forEach(order=>order.history.push({at:timeStamp(),text:'Pedido fictício adicionado à demonstração.'}));
  const initialOrders = JSON.stringify(orders);
  let adminTab='orders', dateFilter='all', editingOrder=null;
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
    if(saved?.version===2 && Array.isArray(saved.orders)) {
      orders=saved.orders.filter(order=>order && /^DEMO-\d+$/.test(order.id) && stages.includes(order.status)).map(normalizeOrder);
      products.forEach(product=>{if(typeof saved.availability?.[product.id]==='boolean')product.available=saved.availability[product.id];});
      simulatedCount=Number(saved.simulatedCount)||0;
      lastOrder=orders.find(order=>order.id===saved.lastOrderId)||null;
      $('#order-count').hidden=!simulatedCount; $('#order-count').textContent=simulatedCount;
    }
  } catch {  $('#storage-warning').hidden=false; }
  function persistDemo() {
    try {localStorage.setItem(storageKey,JSON.stringify({version:2,orders,availability:Object.fromEntries(products.map(p=>[p.id,p.available])),lastOrderId:lastOrder?.id||null,simulatedCount}));}
    catch {$('#storage-warning').hidden=false;}
  }
  function addHistory(order,text){order.history.unshift({at:timeStamp(),text});}
  const confirmDemoDialog=document.createElement('dialog');
  confirmDemoDialog.className='staff-confirm-dialog';confirmDemoDialog.setAttribute('aria-labelledby','staff-confirm-title');
  confirmDemoDialog.innerHTML='<h2 id="staff-confirm-title">Confirmar na demonstração</h2><p id="staff-confirm-message"></p><div><button type="button" id="staff-confirm-cancel" class="staff-row-action">Voltar</button><button type="button" id="staff-confirm-ok" class="button primary">Confirmar</button></div>';
  document.body.append(confirmDemoDialog);
  $('#staff-confirm-cancel').addEventListener('click',()=>confirmDemoDialog.close());
  function confirmDemo(message,action){$('#staff-confirm-message').textContent=message;$('#staff-confirm-ok').onclick=()=>{confirmDemoDialog.close();action();};confirmDemoDialog.showModal();$('#staff-confirm-cancel').focus();}
  function nextOrderId(){return `DEMO-${Math.max(1042,...orders.map(order=>Number(order.id.split('-')[1])||0))+1}`;}
  function totalOf(order){return order.price===null || (order.delivery==='Entrega'&&order.freight===null) ? null : (cents(order.price)+cents(order.freight))/100;}
  function paidOf(order){return order.payments.filter(p=>!p.voided).reduce((sum,p)=>sum+cents(p.amount),0)/100;}
  function balanceOf(order){const total=totalOf(order);return total===null?null:Math.max(0,cents(total)-cents(paidOf(order)))/100;}
  function paymentState(order){return totalOf(order)===null?'quote':balanceOf(order)===0?'paid':paidOf(order)>0?'partial':'pending';}
  const paymentLabels={quote:'Valor a definir',paid:'Pago',partial:'Sinal recebido',pending:'A receber'};
  function paymentBadge(order){const state=paymentState(order);return `<span class="staff-badge payment-${state}">${paymentLabels[state]}</span>`;}
  function stageBadge(order){return `<span class="staff-badge stage-${stages.indexOf(order.status)}">${esc(order.status==='Pronto'&&order.delivery==='Retirada'?'Pronto para retirar':order.status)}</span>`;}
  function openOrderButton(order,label='Abrir pedido'){return `<button class="staff-row-action" data-order="${order.id}">${label} <span aria-hidden="true">↗</span></button>`;}
  function blankState(text){return `<div class="staff-empty"><span aria-hidden="true">✿</span><h3>Nada por aqui.</h3><p>${text}</p></div>`;}
  $('#staff-stage').insertAdjacentHTML('beforeend',stages.map(stage=>`<option>${stage}</option>`).join(''));
  $('#agenda-date').value=localDate(0);

  function showAdminTab(tab){
    adminTab=tab;
    ['orders','payments','deliveries','catalog'].forEach(name=>$('#admin-'+name).hidden=name!==tab);
    $('#staff-stats').hidden=tab==='catalog';
    const titles={orders:['Pedidos da loja','Tudo o que a equipe precisa acompanhar hoje.'],payments:['Pagamentos','Sinais, saldos e recebimentos em um só lugar.'],deliveries:['Entregas e retiradas','Cada presente chegando na hora combinada.'],catalog:['Catálogo e flores','Cuide da disponibilidade dos presentes.']};
    $('#admin-title').textContent=titles[tab][0];$('#admin-subtitle').textContent=titles[tab][1];
    $$('[data-admin-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.adminTab===tab);button.setAttribute('aria-current',button.dataset.adminTab===tab?'page':'false');});
    renderAdmin();
  }
  $$('[data-admin-tab]').forEach(button=>button.addEventListener('click',()=>showAdminTab(button.dataset.adminTab)));
  function renderStats(){
    const active=orders.filter(o=>!['Concluído','Cancelado'].includes(o.status));
    const due=active.filter(o=>o.date===localDate(0));
    const collecting=orders.filter(o=>o.status!=='Cancelado');
    const received=collecting.reduce((sum,o)=>sum+cents(paidOf(o)),0)/100;
    const pending=collecting.reduce((sum,o)=>sum+cents(balanceOf(o)),0)/100;
    const unknown=collecting.filter(o=>totalOf(o)===null).length;
    const stats=adminTab==='payments' ? [
      ['Recebido na simulação',money(received),'Sinais + pagamentos completos'],['Saldo a receber',money(pending),'Pedidos com valor definido'],['Valores a definir',String(unknown).padStart(2,'0'),'Confirme composição e frete']
    ] : [
      ['Em andamento',String(active.length).padStart(2,'0'),'Do atendimento à entrega'],['Para hoje',String(due.length).padStart(2,'0'),`${due.filter(o=>o.delivery==='Entrega').length} entregas · ${due.filter(o=>o.delivery==='Retirada').length} retiradas`],['Saldo a receber',money(pending),unknown?`${unknown} pedido(s) ainda sem valor final`:'Pedidos com valor definido']
    ];
    $('#staff-stats').innerHTML=stats.map(([label,value,note])=>`<div class="staff-stat"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join('');
  }
  function filteredOrders(){
    const query=$('#staff-search').value.trim().toLocaleLowerCase('pt-BR'),stage=$('#staff-stage').value,payment=$('#staff-payment').value;
    return orders.filter(o=>(!query||[o.id,o.buyer,o.recipient,o.productName].join(' ').toLocaleLowerCase('pt-BR').includes(query))
      &&(stage==='all'||(stage==='active'?!['Concluído','Cancelado'].includes(o.status):o.status===stage))
      &&(payment==='all'||(payment==='pending'?['pending','partial'].includes(paymentState(o)):paymentState(o)===payment))
      &&(dateFilter==='all'||o.date===localDate(dateFilter==='today'?0:1)));
  }
  function renderOrders(){
    const list=filteredOrders();
    $('#orders-result-count').textContent=`${list.length} pedido${list.length===1?'':'s'}`;
    $('#staff-order-list').innerHTML=list.length?`<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Pedido / cliente</th><th>Entrega ou retirada</th><th>Valor e pagamento</th><th>Etapa</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>${list.map(o=>`<tr><td><span class="order-code">${o.id}</span><strong>Para ${esc(o.recipient)}</strong><small>De ${esc(o.buyer)}</small><small>${esc(o.productName)} · ${esc(o.size)}</small></td><td><strong>${dateLabel(o.date)} · ${esc(o.delivery)}</strong><small>${esc(o.time)}</small><small>${esc(o.responsible)}</small></td><td><strong>${totalOf(o)===null?'A definir':money(totalOf(o))}</strong>${paymentBadge(o)}${paymentState(o)==='partial'?`<small>Faltam ${money(balanceOf(o))}</small>`:''}</td><td>${stageBadge(o)}</td><td>${openOrderButton(o,'Ver detalhes')}</td></tr>`).join('')}</tbody></table></div>`:blankState('Nenhum pedido corresponde aos filtros. Tente outra busca ou limpe os filtros.');
  }
  function renderPayments(){
    const list=orders.filter(o=>o.status!=='Cancelado').sort((a,b)=>(paymentState(a)==='paid')-(paymentState(b)==='paid'));
    $('#staff-payment-list').innerHTML=list.length?`<div class="staff-table-wrap"><table class="staff-table"><thead><tr><th>Pedido</th><th>Total</th><th>Recebido</th><th>Falta receber</th><th>Situação</th><th><span class="sr-only">Ações</span></th></tr></thead><tbody>${list.map(o=>`<tr><td><span class="order-code">${o.id}</span><strong>${esc(o.buyer)}</strong><small>Para ${esc(o.recipient)}</small></td><td data-label="Total">${totalOf(o)===null?'A definir':money(totalOf(o))}</td><td data-label="Recebido">${money(paidOf(o))}</td><td data-label="Saldo"> <strong>${balanceOf(o)===null?'A definir':money(balanceOf(o))}</strong></td><td>${paymentBadge(o)}</td><td><button class="staff-row-action" data-order="${o.id}" data-focus-payment="true">${paymentState(o)==='paid'?'Ver recebimentos':paymentState(o)==='quote'?'Definir valor':'Registrar recebimento'} ↗</button></td></tr>`).join('')}</tbody></table></div>`:blankState('Os pagamentos aparecem aqui quando você cadastrar um pedido.');
  }
  function nextStage(order){return ({'A confirmar':'Em preparação','Em preparação':'Pronto','Pronto':order.delivery==='Retirada'?'Concluído':'Em entrega','Em entrega':'Concluído'})[order.status];}
  function stageActionLabel(order){return ({'A confirmar':'Iniciar preparação','Em preparação':'Marcar como pronto','Pronto':order.delivery==='Retirada'?'Confirmar retirada':'Saiu para entrega','Em entrega':'Confirmar entrega'})[order.status];}
  function renderDeliveries(){
    const date=$('#agenda-date').value;
    const periodRank=value=>value.startsWith('Manhã')?0:value.startsWith('Tarde')?1:2;
    const list=orders.filter(o=>o.date===date&&o.status!=='Cancelado').sort((a,b)=>periodRank(a.time)-periodRank(b.time));
    $('#agenda-today').classList.toggle('active',date===localDate(0));$('#agenda-tomorrow').classList.toggle('active',date===localDate(1));
    $('#staff-delivery-list').innerHTML=list.length?list.map(o=>`<article class="delivery-card"><div class="delivery-card-top"><span class="delivery-kind">${esc(o.delivery)}</span>${stageBadge(o)}</div><p class="order-code">${o.id} · ${esc(o.time)}</p><h3>Para ${esc(o.recipient)}</h3><p>${esc(o.productName)} · ${esc(o.size)}</p><p class="delivery-address">${esc(o.address)}</p>${o.reference&&o.delivery==='Entrega'?`<small>${esc(o.reference)}</small>`:''}<div class="delivery-card-meta"><span>Responsável: ${esc(o.responsible)}</span>${paymentBadge(o)}</div><div class="delivery-card-actions">${openOrderButton(o,'Conferir pedido')}${nextStage(o)?`<button class="button primary" data-advance="${o.id}">${stageActionLabel(o)}</button>`:'<span class="delivery-done">✓ Finalizado</span>'}</div></article>`).join(''):blankState('Não há entregas ou retiradas para esta data. Escolha outro dia na agenda.');
  }
  function renderAdmin(){
    renderStats();renderOrders();renderPayments();renderDeliveries();
    $('#catalog-admin-list').innerHTML=products.map(product=>`<div class="catalog-admin-row"><img src="${product.image}" alt=""><div><h3>${product.name}</h3><p>${money(product.sizes[0].price)} · ${product.categoryLabel}</p></div><button class="${product.available?'':'paused'}" data-toggle-product="${product.id}" aria-label="${product.available?'Pausar':'Disponibilizar'} ${product.name}">${product.available?'Disponível':'Pausado'}</button></div>`).join('');
  }
  $('#staff-search').addEventListener('input',renderOrders);
  ['#staff-stage','#staff-payment'].forEach(selector=>$(selector).addEventListener('change',renderOrders));
  $$('[data-date-filter]').forEach(button=>button.addEventListener('click',()=>{dateFilter=button.dataset.dateFilter;$$('[data-date-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderOrders();}));
  $('#clear-filters').addEventListener('click',()=>{$('#staff-search').value='';$('#staff-stage').value='active';$('#staff-payment').value='all';$('[data-date-filter="all"]').click();});
  $('#agenda-date').addEventListener('change',renderDeliveries);
  $('#agenda-today').addEventListener('click',()=>{$('#agenda-date').value=localDate(0);renderDeliveries();});
  $('#agenda-tomorrow').addEventListener('click',()=>{$('#agenda-date').value=localDate(1);renderDeliveries();});
  $('#admin-view').addEventListener('click',event=>{
    const button=event.target.closest('[data-order]');if(button){showDetails(button.dataset.order,false,!!button.dataset.focusPayment);return;}
    const advance=event.target.closest('[data-advance]');if(advance){const order=orders.find(o=>o.id===advance.dataset.advance);if(changeStage(order,nextStage(order))){persistDemo();renderAdmin();toast('Etapa atualizada na demonstração.');}else{showDetails(order.id);}}
  });
  $('#catalog-admin-list').addEventListener('click',event=>{const button=event.target.closest('[data-toggle-product]');if(!button)return;const product=products.find(item=>item.id===button.dataset.toggleProduct);product.available=!product.available;persistDemo();renderProducts();renderAdmin();toast(`${product.name}: ${product.available?'disponível':'pausado'} nesta prévia.`);});
  function changeStage(order,next){
    if(next===order.status)return true;
    if(!stages.includes(next))return false;
    if(next==='Em entrega'&&order.delivery==='Retirada'){toast('Este pedido é de retirada. Use “Pronto” ou “Concluído”.');return false;}
    if(next==='Cancelado'&&paidOf(order)>0){toast('Estorne os recebimentos da simulação antes de cancelar o pedido.');return false;}
    if(['Pronto','Em entrega','Concluído'].includes(next)&&!Object.values(order.checklist).every(Boolean)){toast('Confira as flores, o cartão e a embalagem nos detalhes do pedido.');return false;}
    addHistory(order,`Etapa alterada: ${order.status} → ${next}.`);order.status=next;return true;
  }

  function showDetails(id,customer=false,focusPayment=false){
    const order=orders.find(item=>item.id===id);if(!order)return;
    const target=$('#details-dialog');target.classList.toggle('staff-details',!customer);
    const summary=`${line('Presente',`${order.productName} · ${order.size}`)}${line('Cliente',order.buyer)}${line('Telefone',order.phone)}${line('Ocasião',order.occasion)}${line(order.delivery,`${dateLabel(order.date)} · ${order.time}`)}${line('Local',order.address)}${order.reference&&order.delivery==='Entrega'?line('Referência',order.reference):''}${line('Embalagem',order.personalization||'Sem personalização')}${line('Preferências',order.preferences||'Curadoria da loja')}${line('Cartão',order.cardMessage)}`;
    $('#details-content').innerHTML=`<div class="staff-detail-heading"><p class="eyebrow">${order.id} · DEMONSTRAÇÃO</p><h2 id="details-title">Um presente para ${esc(order.recipient)}</h2><div class="staff-inline-badges">${stageBadge(order)}${paymentBadge(order)}</div></div>${customer?`<div>${summary}</div><p class="field-note">Simulação salva neste navegador. Nada foi enviado à loja.</p>`:`
      <div class="staff-detail-grid"><section class="staff-detail-section"><div class="staff-section-head"><h3>Detalhes do pedido</h3><button class="staff-row-action" id="edit-staff-order">Editar pedido ↗</button></div>${summary}</section>
      <section class="staff-detail-section"><h3>Preparação e responsável</h3><form id="staff-status-form"><label>Etapa<select name="status">${stages.map(stage=>`<option${stage===order.status?' selected':''}>${stage}</option>`).join('')}</select></label><label>Responsável<select name="responsible">${teamOptions.map(name=>`<option${name===order.responsible?' selected':''}>${name}</option>`).join('')}</select></label><div class="staff-checklist">${[['flowers','Flores e composição conferidas'],['card','Cartão / personalização conferidos'],['packing','Embalagem pronta']].map(([key,text])=>`<label class="check-row"><input name="${key}" type="checkbox" ${order.checklist[key]?'checked':''}>${text}</label>`).join('')}</div><label>Observação interna<textarea name="notes" rows="3" maxlength="800">${esc(order.notes)}</textarea></label><button class="button primary" type="submit">Salvar acompanhamento</button></form></section>
      <section class="staff-detail-section" id="payment-section"><h3>Pagamento do pedido</h3><div class="staff-money-lines">${line('Presente',money(order.price))}${line('Frete',order.freight===null?'A confirmar':money(order.freight))}${line('Total',totalOf(order)===null?'A definir':money(totalOf(order)))}${line('Recebido',money(paidOf(order)))}${line('Saldo',balanceOf(order)===null?'A definir':money(balanceOf(order)))}</div>${order.status==='Cancelado'?'<p class="field-note">Pedido cancelado.</p>':totalOf(order)===null?'<p class="staff-warning">Edite o pedido e confirme o valor e o frete para registrar um recebimento.</p>':balanceOf(order)>0?`<form id="staff-payment-form"><div class="staff-form-grid"><label>Valor recebido (R$)<input name="amount" type="number" min="0.01" max="${balanceOf(order).toFixed(2)}" step="0.01" value="${balanceOf(order).toFixed(2)}" required></label><label>Forma<select name="method"><option>Pix</option><option>Dinheiro</option><option>Cartão</option></select></label></div><button class="button primary" type="submit">Registrar recebimento simulado</button><p class="field-note">Este registro é manual e fictício. Não consulta o banco e não gera cobrança.</p></form>`:'<p class="staff-paid-message">✓ Valor integral registrado nesta simulação.</p>'}<div class="staff-receipts">${order.payments.map((p,index)=>`<div class="staff-receipt ${p.voided?'voided':''}"><div><strong>${money(p.amount)} · ${esc(p.method)}</strong><small>${momentLabel(p.at)}${p.voided?' · estornado na simulação':''}</small></div>${p.voided?'':`<button data-void-payment="${index}" class="staff-row-action">Estornar simulação</button>`}</div>`).join('')}</div></section>
      <section class="staff-detail-section"><h3>Histórico do atendimento</h3><ol class="staff-history">${order.history.length?order.history.map(item=>`<li><small>${momentLabel(item.at)}</small><p>${esc(item.text)}</p></li>`).join(''):'<li>Pedido recebido nesta demonstração.</li>'}</ol></section></div>`}`;
    if(!customer){
      $('#edit-staff-order').addEventListener('click',()=>{target.close();openStaffOrder(id);});
      $('#staff-status-form').addEventListener('submit',event=>{
        event.preventDefault();const fields=event.currentTarget.elements;
        const previous={...order.checklist};order.checklist={flowers:fields.flowers.checked,card:fields.card.checked,packing:fields.packing.checked};
        if(!changeStage(order,fields.status.value)){order.checklist=previous;return;}
        const changed=order.responsible!==fields.responsible.value||order.notes!==fields.notes.value.trim()||JSON.stringify(previous)!==JSON.stringify(order.checklist);
        order.responsible=fields.responsible.value;order.notes=fields.notes.value.trim();if(changed)addHistory(order,'Conferência, responsável ou observação atualizados.');
        persistDemo();renderAdmin();showDetails(id);toast('Acompanhamento salvo.');
      });
      $('#staff-payment-form')?.addEventListener('submit',event=>{
        event.preventDefault();const fields=event.currentTarget.elements,value=amount(fields.amount.value);
        if(!Number.isFinite(value)||value<=0||cents(value)>cents(balanceOf(order))){toast('Informe um valor maior que zero e até o saldo do pedido.');return;}
        order.payments.push({amount:value,method:fields.method.value,at:timeStamp(),voided:false});addHistory(order,`Recebimento simulado: ${money(value)} via ${fields.method.value}.`);
        persistDemo();renderAdmin();showDetails(id,false,true);toast('Recebimento registrado na simulação.');
      });
      $$('[data-void-payment]',target).forEach(button=>button.addEventListener('click',()=>{
        confirmDemo('Estornar este recebimento fictício? Nenhuma operação bancária será realizada.',()=>{
          const payment=order.payments[Number(button.dataset.voidPayment)];payment.voided=true;addHistory(order,`Estorno simulado: ${money(payment.amount)} via ${payment.method}.`);persistDemo();renderAdmin();showDetails(id,false,true);toast('Estorno registrado somente na simulação.');
        });
      }));
    }
    if(!target.open)target.showModal();target.scrollTop=0;
    if(focusPayment&&!customer)$('#payment-section').scrollIntoView({block:'start'});
  }

  const staffForm=$('#staff-order-form'),staffDialog=$('#staff-order-dialog');
  $('#staff-product').innerHTML=products.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
  function updateStaffSizes(preserve=false){
    const product=products.find(p=>p.id===staffForm.elements.productId.value);
    $('#staff-size').innerHTML=product.sizes.map((s,i)=>`<option value="${i}">${s.name}</option>`).join('');
    if(!preserve)staffForm.elements.price.value=product.sizes[0].price??'';
    updateStaffTotal();
  }
  function updateStaffDelivery(){
    const isDelivery=staffForm.elements.delivery.value==='Entrega';
    ['#staff-freight-label','#staff-address-label','#staff-reference-label'].forEach(selector=>$(selector).hidden=!isDelivery);
    staffForm.elements.address.required=isDelivery;
    staffForm.elements.freight.disabled=!isDelivery;
    updateStaffTotal();
  }
  function updateStaffTotal(){
    const price=amount(staffForm.elements.price.value),freight=staffForm.elements.delivery.value==='Retirada'?0:amount(staffForm.elements.freight.value);
    $('#staff-form-total').textContent=price===null||freight===null?'A definir':money((cents(price)+cents(freight))/100);
  }
  function openStaffOrder(id=null){
    editingOrder=id?orders.find(o=>o.id===id):null;staffForm.reset();$('#staff-form-error').hidden=true;
    $('#staff-order-title').textContent=editingOrder?`Editar ${editingOrder.id}`:'Novo pedido';
    staffForm.elements.date.value=localDate(0);staffForm.elements.date.min=editingOrder&&editingOrder.date<localDate(0)?editingOrder.date:localDate(0);
    if(editingOrder){
      const product=products.find(p=>p.name===editingOrder.productName)||products[0];staffForm.elements.productId.value=product.id;updateStaffSizes(true);
      staffForm.elements.sizeIndex.value=Math.max(0,product.sizes.findIndex(s=>s.name===editingOrder.size));
      for(const key of ['buyer','phone','recipient','responsible','price','occasion','personalization','preferences','cardMessage','delivery','date','time','freight','address','reference','notes'])staffForm.elements[key].value=editingOrder[key]??'';
    }else{updateStaffSizes();staffForm.elements.freight.value='';}
    updateStaffDelivery();staffDialog.showModal();staffDialog.scrollTop=0;
  }
  $('#staff-product').addEventListener('change',()=>updateStaffSizes());
  $('#staff-size').addEventListener('change',()=>{staffForm.elements.price.value=products.find(p=>p.id===staffForm.elements.productId.value).sizes[Number(staffForm.elements.sizeIndex.value)].price??'';updateStaffTotal();});
  staffForm.elements.delivery.addEventListener('change',updateStaffDelivery);
  staffForm.addEventListener('input',()=>{$('#staff-form-error').hidden=true;updateStaffTotal();});
  $('#fill-staff-demo').addEventListener('click',()=>{
    const values={buyer:'Alex (exemplo)',phone:'(00) 00000-0000',recipient:'Dani (exemplo)',date:localDate(0),address:'Rua das Flores, 123 · Centro · Cidade exemplo',freight:'15',cardMessage:'Um carinho para deixar seu dia mais bonito.',preferences:'Flores coloridas.',notes:'Atendimento fictício para apresentação.'};
    Object.entries(values).forEach(([key,value])=>staffForm.elements[key].value=value);updateStaffDelivery();
  });
  staffForm.addEventListener('submit',event=>{
    event.preventDefault();const data=Object.fromEntries([...new FormData(staffForm)].map(([k,v])=>[k,v.trim()]));
    function fail(message){$('#staff-form-error').textContent=message;$('#staff-form-error').hidden=false;$('#staff-form-error').scrollIntoView({block:'center'});}
    if(!data.buyer||!data.recipient||(data.delivery==='Entrega'&&!data.address)){fail('Preencha o cliente, o destinatário e o endereço de entrega.');return;}
    if(data.phone&&!['Não informado · exemplo'].includes(data.phone)&&(!/^[+\d\s().-]+$/.test(data.phone)||data.phone.replace(/\D/g,'').length<10||data.phone.replace(/\D/g,'').length>13)){fail('Confira o telefone com DDD, ou deixe o campo vazio.');return;}
    if(data.date<localDate(0)&&(!editingOrder||data.date!==editingOrder.date)){fail('Escolha hoje ou uma data futura.');return;}
    const product=products.find(p=>p.id===data.productId),size=product.sizes[Number(data.sizeIndex)];
    const updated=normalizeOrder({...data,id:editingOrder?.id||nextOrderId(),productName:product.name,size:size.name,price:amount(data.price),freight:data.delivery==='Retirada'?0:amount(data.freight),address:data.delivery==='Retirada'?'Retirada na loja':data.address,status:editingOrder?.status||'A confirmar',source:editingOrder?.source||'Atendimento da loja',payments:editingOrder?.payments||[],checklist:editingOrder?.checklist||{flowers:false,card:false,packing:false},history:editingOrder?.history||[]});
    if(paidOf(updated)>0&&(totalOf(updated)===null||cents(totalOf(updated))<cents(paidOf(updated)))){fail('O total não pode ficar indefinido ou abaixo do valor já recebido. Ajuste os valores ou estorne o recebimento simulado.');return;}
    if(updated.delivery==='Retirada'&&updated.status==='Em entrega')updated.status='Pronto';
    if(editingOrder){Object.assign(editingOrder,updated);addHistory(editingOrder,'Dados do pedido atualizados pela equipe.');}else{orders.unshift(updated);addHistory(updated,'Pedido cadastrado no atendimento da loja.');}
    persistDemo();renderAdmin();staffDialog.close();showDetails(updated.id);toast(editingOrder?'Pedido atualizado.':'Pedido cadastrado na demonstração.');
  });
  $('#reset-demo').addEventListener('click',()=>{
    confirmDemo('Recomeçar com os pedidos fictícios iniciais? Isso apaga apenas as alterações desta demonstração neste navegador.',()=>{
      orders=JSON.parse(initialOrders);products.forEach(p=>p.available=true);lastOrder=null;simulatedCount=0;$('#order-count').hidden=true;
      activeDraft=false;$('#clear-filters').click();$('#agenda-date').value=localDate(0);persistDemo();renderProducts();renderAdmin();toast('Demonstração reiniciada.');
    });
  });
  renderProducts();renderAdmin();

})();

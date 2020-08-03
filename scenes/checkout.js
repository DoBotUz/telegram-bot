const Markup = require('telegraf/markup');
const WizardScene = require('telegraf/scenes/wizard');
const Composer = require('telegraf/composer');
const { match } = require('telegraf-i18n');
const dbService = require('../services/db');
const _ = require('lodash');

const payment_types = {
	'💵 Наличные': 'CASH'
}

function createOrder() {
  // stub
  return Promise.resolve(1);
}

async function buildCheque(ctx) {
	const products = await dbService('item')
			.whereIn('id', Object.keys(ctx.session.cart).filter(id => ctx.session.cart[id]));
	const text = products.map(product => (
			`*${product.ru_title}*\n` +
			`${ctx.session.cart[product.id]} x ${product.price} = ${ctx.session.cart[product.id] * product.price} сум`
	)).join('\n\n');
	const total = products.reduce((p, c) => {
			return p + ctx.session.cart[c.id]*c.price;
	}, 0);

	return {
			text: '*Ваш заказ:*\n\n'
				+ `*Телефон:* ${ctx.user.phone_number}\n`
				+ (ctx.scene.state.address ? `*Адрес:* ${ctx.scene.state.address}\n` : '')
				+ '*Способ оплаты:* 💵 Наличные\n\n'
				+ '📥 Корзина:\n\n'
				+ text
				+ `\n\n*Итого:* ${total} сум\n`
				+ '*Стоимость доставки:* 5000 сум',
			keyboard: [
					'✅ Заказать',
					ctx.i18n.t('back')
			]
	}
}

module.exports = new WizardScene(
	'checkout',
	ctx => {
		ctx.replyWithMarkdown(
			'📍 Отправьте свою локацию или напишите адрес вручную',
			Markup.keyboard([
				Markup.locationRequestButton('📍 Отправить локацию'),
				ctx.i18n.t('back')
			]).resize().extra()
		);
		ctx.wizard.next();
	},
	new Composer()
		.hears(match('back'), ctx => {
			ctx.scene.enter('menu');
		})
		.on('location', (ctx, next) => {
			ctx.scene.state.location = ctx.message.location;
			next(ctx);
		})
		.on('text', (ctx, next) => {
			ctx.scene.state.address = ctx.message.text;
			next(ctx);
		})
		.use((ctx) => {
			ctx.replyWithMarkdown(
				'Выберите способ оплаты',
				Markup.keyboard([
					...Object.keys(payment_types),
					ctx.i18n.t('back')
				]).resize().extra()
			);
			ctx.wizard.next();
		}),
	new Composer()
		.hears(match('back'), ctx => {
			ctx.scene.reenter();
		})
		.hears('💵 Наличные', async ctx => {
			ctx.scene.state.payment_type = payment_types[ctx.message.text];
			let cheque = await buildCheque(ctx);
			ctx.replyWithMarkdown(
				cheque.text,
				Markup.keyboard(
					cheque.keyboard
				).resize().extra()
			);
			ctx.wizard.next();
		}),
	new Composer()
		.hears(match('back'), ctx => {
			ctx.replyWithMarkdown(
				'Выберите способ оплаты',
				Markup.keyboard([
					...Object.keys(payment_types),
					ctx.i18n.t('back')
				]).resize().extra()
			);
			ctx.wizard.back();
		})
		.hears('✅ Заказать', async ctx => {
			let orderId = await createOrder({
				chat_id: ctx.from.id,
				client: ctx.user.id,
				...ctx.scene.state,
				cart: ctx.session.cart,
				delivery_price: 5000
			});
			ctx.replyWithMarkdown(
				`Заказ принят. Номер заказа #${orderId}. Ожидайте звонка оператора`
			);
			ctx.scene.leave();
			return global.routes.start(ctx);
		})
)
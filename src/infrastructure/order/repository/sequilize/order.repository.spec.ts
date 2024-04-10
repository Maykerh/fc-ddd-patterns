import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update an existing order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const customer2 = new Customer("456", "Customer 1");
    const address2 = new Address("Street 2", 1, "Zipcode 1", "City 1");
    customer2.changeAddress(address2);
    await customerRepository.create(customer2);
    
    const productRepository = new ProductRepository();

    const product = new Product("111", "Product 1", 10);
    await productRepository.create(product);

    const product2 = new Product("222", "Product 2", 15);
    await productRepository.create(product2);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);
    const order = new Order("222", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const newOrderItem = new OrderItem("2", product2.name, product2.price, product2.id, 2)
    const newOrder = new Order("222", "456", [orderItem, newOrderItem]);

    await orderRepository.update(newOrder);

    const updatedOrder = await OrderModel.findByPk("222", {
      include: [
        { 
          model: OrderItemModel,
          as: 'items'
        }
      ]
    });

    expect(updatedOrder.total).toBe(50);

    expect(updatedOrder.items[0].id).toBe("1");
    expect(updatedOrder.items[0].name).toBe("Product 1");
    expect(updatedOrder.items[0].price).toBe(10);
    expect(updatedOrder.items[0].quantity).toBe(2);
    expect(updatedOrder.items[0].product_id).toBe("111");

    expect(updatedOrder.items[1].id).toBe("2");
    expect(updatedOrder.items[1].name).toBe("Product 2");
    expect(updatedOrder.items[1].price).toBe(15);
    expect(updatedOrder.items[1].quantity).toBe(2);
    expect(updatedOrder.items[1].product_id).toBe("222");
  });

  it("should find an existing order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("111", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "111",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const foundOrder = await orderRepository.find("123");

    expect(foundOrder).toEqual(order);
  });

  it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("111", "Product 1", 10);
    await productRepository.create(product);

    const orderItem1 = new OrderItem("111",product.name,product.price,product.id,2);
    const orderItem2 = new OrderItem("222",product.name,product.price,product.id,2);

    const order1 = new Order("123", "123", [orderItem1]);
    const order2 = new Order("456", "123", [orderItem2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order1);
    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();

    expect(orders.length).toBe(2);
  });
});

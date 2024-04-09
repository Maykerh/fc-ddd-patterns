import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async update(entity: Order): Promise<void> {
    const order = await OrderModel.findByPk(entity.id);
  
    if (!order) {
      throw new Error("Order not found.");
    }
  
    order.customer_id = entity.customerId;

    // Update outros campos ...

    await order.save();
  }
  
  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findByPk(id, {
      include: [
        { 
          model: OrderItemModel,
          as: 'items'
        }
      ]
    });

    const items = orderModel.items.map(itemModel => new OrderItem(
      itemModel.id,
      itemModel.name,
      itemModel.price,
      itemModel.product_id,
      itemModel.quantity
    ));

    const order = new Order(orderModel.id, orderModel.customer_id, items);
    
    if (!order) {
      throw new Error("Order not found.");
    }
    
    return order;
  }

  async findAll(): Promise<Order[]> {
    const orderModelList = await OrderModel.findAll({
      include: [
        { 
          model: OrderItemModel,
          as: 'items'
        }
      ]
    });

    const orders = orderModelList.map(model =>  {
      const items = model.items.map(itemModel => new OrderItem(
        itemModel.id,
        itemModel.name,
        itemModel.price,
        itemModel.product_id,
        itemModel.quantity
      ));

      const order = new Order(model.id, model.customer_id, items);

      return order;
    });

    return orders;
  }

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }
}

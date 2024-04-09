import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import CustomerRepositoryInterface from "../../../../domain/customer/repository/customer-repository.interface";
import CustomerModel from "./customer.model";
import CustomerCreatedEvent from "../../../../domain/customer/event/customer-created.event";
import EventDispatcher from "../../../../domain/@shared/event/event-dispatcher";
import LogWhenCustomerAddressIsChanged from "../../../../domain/customer/event/handler/log-when-customer-address-is-changed.handler";
import LogWhenCustomerIsCreated from "../../../../domain/customer/event/handler/log-when-customer-is-created.handler";
import Log2WhenCustomerIsCreated from "../../../../domain/customer/event/handler/log2-when-customer-is-created.handler copy";
import CustomerAddressChangedEvent from "../../../../domain/customer/event/customer-address-changed.event";

export default class CustomerRepository implements CustomerRepositoryInterface {
  async create(entity: Customer): Promise<void> {
    const customer = await CustomerModel.create({
      id: entity.id,
      name: entity.name,
      street: entity.Address.street,
      number: entity.Address.number,
      zipcode: entity.Address.zip,
      city: entity.Address.city,
      active: entity.isActive(),
      rewardPoints: entity.rewardPoints,
    });

    const eventDispatcher = new EventDispatcher();
    const eventHandler = new LogWhenCustomerIsCreated();
    const eventHandler2 = new Log2WhenCustomerIsCreated();

    eventDispatcher.register("ProductCreatedEvent", eventHandler);
    eventDispatcher.register("ProductCreatedEvent", eventHandler2);

    eventDispatcher.notify(new CustomerCreatedEvent(customer))
  }

  async update(entity: Customer): Promise<void> {
    await CustomerModel.update(
      {
        name: entity.name,
        street: entity.Address.street,
        number: entity.Address.number,
        zipcode: entity.Address.zip,
        city: entity.Address.city,
        active: entity.isActive(),
        rewardPoints: entity.rewardPoints,
      },
      {
        where: {
          id: entity.id,
        },
      }
    );
  }

  async find(id: string): Promise<Customer> {
    let customerModel;
    try {
      customerModel = await CustomerModel.findOne({
        where: {
          id,
        },
        rejectOnEmpty: true,
      });
    } catch (error) {
      throw new Error("Customer not found");
    }

    const customer = new Customer(id, customerModel.name);
    const address = new Address(
      customerModel.street,
      customerModel.number,
      customerModel.zipcode,
      customerModel.city
    );
    customer.changeAddress(address);
    return customer;
  }

  async findAll(): Promise<Customer[]> {
    const customerModels = await CustomerModel.findAll();

    const customers = customerModels.map((customerModels) => {
      let customer = new Customer(customerModels.id, customerModels.name);
      customer.addRewardPoints(customerModels.rewardPoints);
      const address = new Address(
        customerModels.street,
        customerModels.number,
        customerModels.zipcode,
        customerModels.city
      );
      customer.changeAddress(address);
      if (customerModels.active) {
        customer.activate();
      }
      return customer;
    });

    return customers;
  }
}

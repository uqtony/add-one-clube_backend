import { ActivityStatus } from "../enum/ActivityStatus";
import { Activity } from "../entity/Activity";
import activityRepository from "../repository/activityRepository";
import { ActivityDto, DiscountDto } from "../dto/ActivityDTO";
import HttpException from "../exception/HttpException";
import discountRepository from "../repository/discountRepository";
import publishService from "./publishService";
import orderService from "./orderService";
import activityImageRepository from "../repository/activityImageRepository";
import activityVideoRepository from "../repository/activityVideoRepository";
import { OrderStatus } from "../enum/OrderStatus";
import { transfer } from "../dto/ActivtyDTOForMachine";
import { Discount } from "../entity/Discount";
const publishMobilePage =
  process.env.PUBLISH_MOBILE_PAGE || "http://localhost:3000/mobile/publish";
const discountError = new HttpException(400, "階層設定異常");
type activityProps = {
  activityId?: number;
  activity?: Activity;
  updateNow?: boolean;
};
class ActivityService {
  private validImages(activity: ActivityDto) {
    let images = activity.images;
    if (images.length < 1) {
      throw new HttpException(400, "至少要有一張產品圖");
    }
  }
  private validTimes(activity: ActivityDto) {
    if (activity.end_at < activity.start_at) {
      throw new HttpException(400, "結束時間須晚於開始時間");
    }
    if (activity.pay_end_at < activity.end_at) {
      throw new HttpException(400, "購買截止日不得早於結束時間");
    }
  }
  private validDicounts(discounts: DiscountDto[]) {
    for (let i = 0; i < discounts.length; i++) {
      let discount = discounts[i];
      if (
        isNaN(discount.peopleCount) ||
        discount.peopleCount < 0 ||
        isNaN(discount.percent) ||
        discount.percent < 0 ||
        discount.percent > 100
      ) {
        throw discountError;
      }
      if (i > 0) {
        let bef = discounts[i - 1];
        if (
          discount.peopleCount <= bef.peopleCount ||
          discount.percent >= bef.percent
        ) {
          throw discountError;
        }
      }
    }
  }
  private validActivity(activity: ActivityDto) {
    if (!activity.code || !activity.name) {
      throw new HttpException(400, "請填寫完整資訊");
    }
    this.validImages(activity);
    this.validTimes(activity);
    this.validDicounts(activity.discounts);
  }
  private validActivityForCreate(activity: ActivityDto) {
    this.validActivity(activity);
    let now = new Date().getTime() / 1000;
    if (now > activity.start_at) {
      throw new HttpException(400, "開始時間錯誤");
    }
  }
  async create(userId: number, activity: ActivityDto) {
    this.validActivityForCreate(activity);
    let temp = await activityRepository.findOne({
      where: { code: activity.code, userId: userId },
    });
    if (temp) {
      throw new HttpException(400, "活動編碼已存在");
    }
    let entity = activityRepository.create({
      code: activity.code,
      name: activity.name,
      description: activity.description,
      start_at: activity.start_at,
      end_at: activity.end_at,
      pay_end_at: activity.pay_end_at,
      price: activity.price,
      total_count: activity.total_count,
      userId: userId,
    });

    let discountEntitys = activity.discounts.map((elem, index) => {
      let level = index + 1;
      let item = discountRepository.create({
        level,
        peopleCount: elem.peopleCount,
        percent: elem.percent,
      });
      return item;
    });
    entity.discounts = discountEntitys;
    let result = await activityRepository.save(entity);
    let images = activity.images.map((elem) => {
      let item = activityImageRepository.create({
        activityId: result.id,
        fileName: elem.fileName,
        order: elem.order,
      });
      return item;
    });
    let videos = activity.videos.map((elem) => {
      let item = activityVideoRepository.create({
        activityId: result.id,
        fileName: elem.fileName,
        order: elem.order,
      });
      return item;
    });
    result.images = await activityImageRepository.bulkSave(images);
    result.videos = await activityVideoRepository.bulkSave(videos);
    return result;
  }
  async update(userId: number, activity: ActivityDto) {
    this.validActivity(activity);
    let entity = await activityRepository.findById(activity.id);
    if (!entity) {
      throw new HttpException(400, "activity not found");
    }
    if (entity.userId !== userId) {
      throw new HttpException(403, "permission deny");
    }
    if (entity.status === ActivityStatus.END) {
      throw new HttpException(400, "activity can't modify when status is end");
    }
    entity.code = activity.code;
    entity.name = activity.name;
    entity.description = activity.description;
    entity.start_at = activity.start_at;
    entity.end_at = activity.end_at;
    entity.price = activity.price;
    entity.pay_end_at = activity.pay_end_at;
    entity.total_count = activity.total_count;
    let images = activity.images.map((elem) => {
      let item = activityImageRepository.create({
        activityId: entity?.id,
        fileName: elem.fileName,
        order: elem.order,
      });
      return item;
    });
    let videos = activity.videos.map((elem) => {
      let item = activityVideoRepository.create({
        activityId: entity?.id,
        fileName: elem.fileName,
        order: elem.order,
      });
      return item;
    });
    let discountEntitys = activity.discounts.map((elem, index) => {
      let level = index + 1;
      return discountRepository.create({
        level,
        peopleCount: elem.peopleCount,
        percent: elem.percent,
      });
    });
    entity.discounts = discountEntitys;
    entity.images = images;
    entity.videos = videos;
    await activityImageRepository.delete({ activityId: entity.id });
    await activityVideoRepository.delete({ activityId: entity.id });
    let result = await activityRepository.save(entity);
    return result;
  }
  async findAll({
    userId,
    status,
  }: {
    userId: number;
    status?: ActivityStatus;
  }) {
    let query: any = {};
    if (status) {
      query.status = status;
    }
    let list: Activity[] = await activityRepository.findByUserIdWithDiscount(
      userId,
      query
    );
    return list;
  }
  async findAllWithoutStatus(userId: number, status: ActivityStatus) {
    let list: Activity[] = await activityRepository.findByUserIdWithDiscountExcludeStatus(
      userId,
      status
    );
    return list;
  }
  async delete(id: number) {
    await activityRepository.deleteById(id);
  }
  async updateActivityCounts(activityId: number) {
    let activity = await activityRepository.findById(activityId);
    if (!activity) {
      throw new HttpException(400, "activity not found");
    }
    let publishs = await publishService.findByActivityIdWithOrders(activityId);
    let {
      buyPeople,
      registeredPeople,
      linkCount,
      preorderProductCount,
    } = publishs.reduce<{
      buyPeople: number[];
      registeredPeople: number[];
      linkCount: number;
      preorderProductCount: number;
    }>(
      (acc, cur) => {
        acc.linkCount += cur.linkCount;
        cur.orders.forEach((order) => {
          if (!acc.registeredPeople.includes(order.customerId)) {
            acc.registeredPeople.push(order.customerId);
          }
          if (
            order.status !== OrderStatus.PREORDER &&
            !acc.buyPeople.includes(order.customerId)
          ) {
            acc.buyPeople.push(order.customerId);
          }
          acc.preorderProductCount += order.preCount;
        });
        return acc;
      },
      {
        buyPeople: [],
        registeredPeople: [],
        linkCount: 0,
        preorderProductCount: 0,
      }
    );
    activity.registeredCount = registeredPeople.length;
    activity.buyCount = buyPeople.length;
    activity.linkCount = linkCount;
    activity.preorderProductItem = preorderProductCount;
    await activityRepository.save(activity);
  }
  private async getActivity({
    activityId,
    activity,
  }: activityProps): Promise<Activity> {
    if (!activity && activityId) {
      activity = await activityRepository.findByIdWithDiscount(activityId);
      if (activity) {
        return activity;
      } else {
        throw new HttpException(400, "param not found");
      }
    } else if (activity) {
      return activity;
    } else {
      throw new HttpException(400, "param not found");
    }
  }
  async updateAllActivityStatus() {
    let activitys = await activityRepository.findAllExcludeStatus(
      ActivityStatus.END
    );
    let update: Activity[] = [];
    let now = new Date().getTime() / 1000;
    for (let i = 0; i < activitys.length; i++) {
      let elem = activitys[i];
      if (elem.status === ActivityStatus.NOT_STARTED && elem.start_at <= now) {
        elem.status = ActivityStatus.START;
        update.push(elem);
      }
      if (elem.status === ActivityStatus.START && elem.end_at <= now) {
        elem = await this.updateActivityStatusToEnd({
          activity: elem,
          updateNow: false,
        });
        update.push(elem);
      }
    }
    await activityRepository.bulkSave(update);
  }
  getDiscountLevelAndFinalPrice(act: Activity) {
    let discounts = act.discounts.sort((a, b) => b.level - a.level);
    discounts = discounts.filter(
      (discount) => act.registeredCount >= discount.peopleCount
    );
    let level = 0;
    let price = act.price;
    let discount: Discount | null = null;
    if (discounts.length > 0) {
      level = discounts[0].level;
      price = Math.round((discounts[0].percent * price) / 100);
      discount = discounts[0];
    }
    return { level, price, discount };
  }
  async updateActivityDiscountLevelAndFinalPrice(activityId: number) {
    let act = await this.getActivity({ activityId });
    const { level, price, discount } = this.getDiscountLevelAndFinalPrice(act);
    if (level != act.discountLevel && discount) {
      act.discountLevel = level;
      act.finalPrice = price;
      act = await activityRepository.save(act);
      await orderService.sendDiscountSMSToCustomerByActivityId(
        act.id,
        discount
      );
    }
    return act;
  }
  async updateFinalPrice({ activityId, activity, updateNow }: activityProps) {
    let act = await this.getActivity({ activityId, activity });
    let finalPrice = act.price;
    let price = act.price;
    let discounts = act.discounts.sort((a, b) => a.level - b.level);
    discounts.forEach((discount) => {
      if (act.registeredCount >= discount.peopleCount) {
        finalPrice = (price / 100) * discount.percent;
      }
    });
    act.finalPrice = finalPrice;
    if (updateNow) {
      act = await activityRepository.save(act);
    }
    return act;
  }
  async updateActivityStatusToEnd({
    activityId,
    activity,
    updateNow,
  }: activityProps) {
    let act = await this.getActivity({ activityId, activity });
    act.status = ActivityStatus.END;
    if (updateNow) {
      await activityRepository.save(act);
    }
    // act = await this.updateFinalPrice({ activity: act, updateNow });
    orderService.sendSMSToCustomerByActivityId(act.id);
    // orderService.sendMailToCutomerByActivityId(act.id);
    return act;
  }
  async findPublishActivitysForMachine(machineId: number) {
    let publishs = await publishService.findByMachineIdAndActivityStatusIsStartAndPublish(
      machineId
    );
    return publishs.map((publish) => {
      let obj = transfer(publish.activity);
      let link = `${publishMobilePage}/${publish.id}`;
      return { ...obj, link };
    });
  }
  async findRegisterCountById(activityId: number) {
    const entity = await activityRepository.findRegisterCountById(activityId);
    if (!entity) {
      throw new HttpException(400, "activity not found");
    }
    return entity.registeredCount;
  }
}
export default new ActivityService();

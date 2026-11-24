import type { MomentId, PlaceId } from "@/game/types";

export type ActionDef = {
  id: string;
  place: PlaceId;
  label: string;
  hours: number;
  energy: number;
  mood: number;
  satiety: number;
  money: number;
  line: string;
  moment?: MomentId;
  sleep?: boolean;
  clinic?: boolean;
  minHour?: number;
  maxHour?: number;
};

export const PLACE_INFO: Record<PlaceId, { name: string; blurb: string }> = {
  villa: {
    name: "Biệt thự",
    blurb: "Nhà trắng, ban công nhìn thẳng ra vịnh.",
  },
  beach: {
    name: "Bãi biển",
    blurb: "Cát dài, tàu xa, sóng đều.",
  },
  park: {
    name: "Bờ kè",
    blurb: "Hàng dương và đường xe đạp dọc biển.",
  },
  cafe: {
    name: "Cà phê Sóng",
    blurb: "Quán nhỏ, bàn gỗ, sữa đá trên thành ly.",
  },
  market: {
    name: "Chợ chiều",
    blurb: "Hải sản, trái cây, tiếng chào hàng.",
  },
  pier: {
    name: "Cảng",
    blurb: "Cầu gỗ, dây neo, mùi muối.",
  },
  clinic: {
    name: "Phòng khám",
    blurb: "Phòng khám nhỏ. Bác sĩ nói khẽ.",
  },
};

export const MOMENT_COPY: Record<MomentId, { title: string; line: string }> = {
  "ban-cong": { title: "Ban công", line: "Một tách cà phê và cả vịnh." },
  "chan-cat": { title: "Dấu chân", line: "Sóng xóa, ký ức thì không." },
  "cho": { title: "Chợ chiều", line: "Câu chuyện không bán theo ký." },
  "xe-dap": { title: "Bờ kè", line: "Gió trong tóc, phố bên trái." },
  vinh: { title: "Vịnh", line: "Núi ở xa, nước ở gần." },
  dem: { title: "Đêm vịnh", line: "Đèn thuyền rải trên mặt nước." },
};

export const ACTIONS: ActionDef[] = [
  {
    id: "pha",
    place: "villa",
    label: "Pha cà phê ban công",
    hours: 1,
    energy: -2,
    mood: 12,
    satiety: -4,
    money: 0,
    moment: "ban-cong",
    line: "Cà phê đắng, gió mặn. Vịnh nằm im dưới ban công.",
  },
  {
    id: "nau",
    place: "villa",
    label: "Nấu một bữa",
    hours: 2,
    energy: -6,
    mood: 8,
    satiety: 34,
    money: -55000,
    line: "Cơm, rau và chút cá. Bếp thơm ra tới cửa.",
  },
  {
    id: "gian",
    place: "villa",
    label: "Giãn người trong nhà",
    hours: 1,
    energy: 12,
    mood: 6,
    satiety: -4,
    money: 0,
    line: "Vài phút giãn vai trong phòng khách. Người nhẹ hơn.",
  },
  {
    id: "ngu",
    place: "villa",
    label: "Ngủ",
    hours: 0,
    energy: 0,
    mood: 0,
    satiety: 0,
    money: 0,
    sleep: true,
    line: "Một giấc ở biệt thự. Sáng ra vịnh vẫn đó.",
  },
  {
    id: "dibo",
    place: "beach",
    label: "Đi bộ trên cát",
    hours: 2,
    energy: -12,
    mood: 14,
    satiety: -8,
    money: 0,
    moment: "chan-cat",
    line: "Cát còn ấm. Sóng liếm mất dấu chân.",
  },
  {
    id: "ngoi",
    place: "beach",
    label: "Ngồi xem tàu",
    hours: 2,
    energy: -3,
    mood: 10,
    satiety: -4,
    money: 0,
    line: "Tàu nhỏ đi ngang. Bạn không cần đi theo.",
  },
  {
    id: "dua",
    place: "beach",
    label: "Uống nước dừa",
    hours: 1,
    energy: 4,
    mood: 8,
    satiety: 12,
    money: -25000,
    line: "Dừa mát. Muối trên môi nhạt đi.",
  },
  {
    id: "suada",
    place: "cafe",
    label: "Cà phê sữa đá",
    hours: 1,
    energy: 8,
    mood: 10,
    satiety: 6,
    money: -35000,
    line: "Sữa đá đúng độ. Đá kêu leng keng.",
  },
  {
    id: "viec",
    place: "cafe",
    label: "Làm vài việc",
    hours: 3,
    energy: -16,
    mood: -2,
    satiety: -8,
    money: 220000,
    line: "Xong một việc. Túi dày thêm một chút.",
  },
  {
    id: "doc",
    place: "cafe",
    label: "Đọc một chương",
    hours: 2,
    energy: -3,
    mood: 12,
    satiety: -3,
    money: 0,
    line: "Một chương sách. Quán không vội.",
  },
  {
    id: "haisan",
    place: "market",
    label: "Bữa hải sản",
    hours: 2,
    energy: -4,
    mood: 12,
    satiety: 32,
    money: -150000,
    line: "Tôm ngọt, chanh và ớt. Bàn hơi dính mắm.",
  },
  {
    id: "traicay",
    place: "market",
    label: "Rổ trái cây",
    hours: 1,
    energy: 6,
    mood: 6,
    satiety: 14,
    money: -40000,
    line: "Xoài và chuối. Túi hơi nặng, người thì nhẹ.",
  },
  {
    id: "chuyen",
    place: "market",
    label: "Ngồi nói chuyện",
    hours: 1,
    energy: -2,
    mood: 14,
    satiety: -2,
    money: 0,
    moment: "cho",
    line: "Cô bán hàng kể chuyện mưa năm ngoái. Không tính tiền.",
  },
  {
    id: "dapxe",
    place: "park",
    label: "Đạp xe bờ kè",
    hours: 2,
    energy: -16,
    mood: 16,
    satiety: -10,
    money: 0,
    moment: "xe-dap",
    line: "Gió trong tóc. Thành phố chạy bên trái.",
  },
  {
    id: "ghe",
    place: "park",
    label: "Ngồi ghế đá",
    hours: 1,
    energy: 4,
    mood: 8,
    satiety: -2,
    money: 0,
    line: "Ghế đá ấm nhẹ. Dương reo đều.",
  },
  {
    id: "chim",
    place: "park",
    label: "Cho chim ăn",
    hours: 1,
    energy: -2,
    mood: 10,
    satiety: -2,
    money: -10000,
    line: "Vài hạt, vài cánh. Xong việc.",
  },
  {
    id: "kham",
    place: "clinic",
    label: "Khám định kỳ",
    hours: 1,
    energy: 24,
    mood: 4,
    satiety: -2,
    money: -150000,
    clinic: true,
    line: "Huyết áp ổn. Bác sĩ nhắc uống nước và ngủ đủ.",
  },
  {
    id: "oresol",
    place: "clinic",
    label: "Mua oresol",
    hours: 1,
    energy: 8,
    mood: 2,
    satiety: 4,
    money: -20000,
    line: "Gói muối khoáng trong túi. Nhỏ, nhưng có ích.",
  },
  {
    id: "tour",
    place: "pier",
    label: "Tour vịnh ngắn",
    hours: 3,
    energy: -14,
    mood: 20,
    satiety: -8,
    money: -280000,
    moment: "vinh",
    minHour: 7,
    maxHour: 16,
    line: "Thuyền ra một đoạn. Núi ở xa, nước ở gần.",
  },
  {
    id: "thuyen",
    place: "pier",
    label: "Xem thuyền về bến",
    hours: 1,
    energy: -2,
    mood: 10,
    satiety: -2,
    money: 0,
    line: "Thuyền về, dây neo kêu. Đèn bắt đầu lên.",
  },
];

export function actionsFor(place: PlaceId) {
  return ACTIONS.filter((a) => a.place === place);
}

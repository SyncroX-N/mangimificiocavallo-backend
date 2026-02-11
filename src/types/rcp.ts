import type { requestStatusEnum } from "@/db/schema";

export type RequestStatus = (typeof requestStatusEnum.enumValues)[number];

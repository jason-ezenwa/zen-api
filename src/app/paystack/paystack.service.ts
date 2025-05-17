import axios from "axios";
import { logEvent } from "../../utils";
import { NotFoundError, UnprocessableContentError } from "../errors";
import { BadRequestError } from "../errors";

export class PaystackService {
  constructor() {}

  PAYSTACK_CHARGE_RATE = 0.015;
  PAYSTACK_FLAT_FEE = 100;
  MAX_PAYSTACK_CHARGE = 2000;
  PAYSTACK_API_BASE_URL = process.env.PAYSTACK_API_BASE_URL;
  PAYSTACK_API_SECRET_KEY = process.env.PAYSTACK_API_SECRET_KEY;

  calculatePaystackCharge(amount: number) {
    const charge = amount * this.PAYSTACK_CHARGE_RATE + this.PAYSTACK_FLAT_FEE;

    return Math.min(charge, this.MAX_PAYSTACK_CHARGE);
  }

  /**
   * Calculates the total amount to be sent to Paystack, ensuring that after
   * Paystack deducts its transaction fee, we receive
   * the exact intended amount.
   *
   * Paystack calculates its charge on the final amount, not the initial amount,
   * leading to a slight underpayment if the charge is simply added.
   * This function adjusts the total by iteratively computing the correct
   * amount that results in the expected net amount after Paystack's fee is applied.
   *
   * @param intendedAmount - The exact amount the user wants to pay us (in Naira).
   * @returns The total amount to be sent to Paystack, including fees.
   */
  calculatePayableAmount(intendedAmount: number): number {
    let estimatedAmount = intendedAmount;

    while (true) {
      const charge = this.calculatePaystackCharge(estimatedAmount);
      const newEstimatedAmount = intendedAmount + charge;

      if (newEstimatedAmount === estimatedAmount) break; // Converged

      estimatedAmount = newEstimatedAmount;
    }

    return estimatedAmount;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    transactionReference: string
  ) {
    try {
      if (!this.PAYSTACK_API_BASE_URL || !this.PAYSTACK_API_SECRET_KEY) {
        throw new Error("Paystack API base URL or secret key not set");
      }

      const totalAmount = Math.ceil(this.calculatePayableAmount(amount));

      const response = await axios
        .post(
          `${this.PAYSTACK_API_BASE_URL}/transaction/initialize`,
          {
            email,
            amount: totalAmount * 100, // Paystack expects amount in kobo
            callback_url: `${process.env.HOME_URL}/dashboard`,
            reference: transactionReference,
            channels:
              process.env.NODE_ENV === "production"
                ? ["bank_transfer"]
                : ["bank_transfer", "card"],
          },
          {
            headers: {
              Authorization: `Bearer ${this.PAYSTACK_API_SECRET_KEY}`,
            },
          }
        )
        .catch((error) => {
          if (error.response) {
            if (error.response.status === 404) {
              throw new NotFoundError(error.response.data.message);
            }

            if (error.response.status === 400) {
              throw new BadRequestError(error.response.data.message);
            }

            if (error.response.status === 422) {
              throw new UnprocessableContentError(error.response.data.message);
            }

            if (error.response.data.message) {
              throw new Error(error.response.data.message);
            }

            throw new Error(error.response.data.message || error.message);
          }

          throw new Error(
            "No response from Paystack while initializing transaction"
          );
        });

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      const paymentLink = response.data.data.authorization_url;

      return paymentLink;
    } catch (error: any) {
      logEvent("error", "Error initializing Paystack transaction", {
        error,
      });

      throw new Error("Error initializing Paystack transaction");
    }
  }

  /**
   * Verify a Paystack transaction
   * @param reference transaction reference
   * @returns true if the transaction was successful, false otherwise
   */
  async verifyTransaction(reference: string) {
    try {
      logEvent("info", "Verifying Paystack transaction", { reference });

      if (!this.PAYSTACK_API_BASE_URL || !this.PAYSTACK_API_SECRET_KEY) {
        throw new Error("Paystack API base URL or secret key not set");
      }

      const response = await axios.get(
        `${this.PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_API_SECRET_KEY}`,
          },
        }
      );

      if (!response.data.status) {
        throw new Error(response.data.message);
      }

      const status = response.data.data.status;

      logEvent("info", "Paystack transaction verified", { reference, status });

      return status === "success";
    } catch (error: any) {
      logEvent("error", "Error verifying Paystack transaction", {
        error: error.response.data,
      });

      throw new Error("Error verifying Paystack transaction");
    }
  }
}

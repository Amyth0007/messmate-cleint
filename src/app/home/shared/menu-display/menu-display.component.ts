import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { OrderData, OrderResponse, OrderService } from '../../../services/order.service';

import { OrderService } from 'src/app/services/order.service';
import { OrderData, OrderResponse } from 'src/app/auth/interfaces/user.interface';
import { SuccessPopupData, SuccessPopupComponent } from '../success-popup/success-popup.component';
import { ThaliService } from 'src/app/services/thalis.service';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVegetarian: boolean;
  spicyLevel: number; // 1-3
}

interface SelectedItem {
  item: MenuItem;
  quantity: number;
}

interface UserIntent {
  messId: number;
  messName: string;
  selectedItems: SelectedItem[];
  headCount: number;
  totalAmount: number;
  timestamp: Date;
}

@Component({
  selector: 'app-menu-display',
  templateUrl: './menu-display.component.html',
  styleUrls: ['./menu-display.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SuccessPopupComponent]
})
export class MenuDisplayComponent implements OnInit, OnChanges{
  @Input() messId: number | null = 0;
  @Input() messName: string = '';

  defaultImage = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80';
  headCount: number = 1;
  selectedItems: Map<number, number> = new Map(); // itemId -> quantity
  isSharingIntent: boolean = false;
  public menuItems : any = []

  // Success popup properties
  showSuccessPopup: boolean = false;
  successPopupData: SuccessPopupData = {
    title: 'Intent Shared Successfully!',
    message: 'Your intent has been shared with the mess owner.',
    showOrderId: false
  };

  constructor(private orderService: OrderService,  private thaliService: ThaliService,) {

  }

  ngOnInit(): void {
    this.getThaliData()
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.getThaliData()
  }
  // Handle image error
  handleImageError(event: any) {
    event.target.src = this.defaultImage;
  }

  // Get quantity for an item
  getItemQuantity(itemId: number): number {
    return this.selectedItems.get(itemId) || 0;
  }

  // Update item quantity
  updateItemQuantity(itemId: number, quantity: number) {
    if (quantity <= 0) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.set(itemId, quantity);
    }
  }

  // Get selected items with details
  getSelectedItemsWithDetails(): SelectedItem[] {
    const selectedItems: SelectedItem[] = [];
    this.selectedItems.forEach((quantity, itemId) => {
      const item = this.menuItems.find((menuItem : any) => menuItem.id === itemId);
      if (item) {
        selectedItems.push({ item, quantity });
      }
    });
    return selectedItems;
  }

  // Calculate total amount
  getTotalAmount(): number {
    let total = 0;
    this.selectedItems.forEach((quantity, itemId) => {
      const item = this.menuItems.find((menuItem : any
       ) => menuItem.id === itemId);
      if (item) {
        total += item.price * quantity;
      }
    });
    return total;
  }

  // Check if any items are selected
  hasSelectedItems(): boolean {
    return this.selectedItems.size > 0;
  }

  // Increase head count
  increaseHeadCount() {
    this.headCount = Math.min(20, this.headCount + 1);
  }

  // Decrease head count
  decreaseHeadCount() {
    this.headCount = Math.max(1, this.headCount - 1);
  }

  // Show success popup
  showSuccessPopupWithData(response: OrderResponse) {
    const selectedItemsDetails = this.getSelectedItemsWithDetails();
    const details = [
      `Mess: ${this.messName}`,
      `Head Count: ${this.headCount} person(s)`,
      `Total Amount: ₹${this.getTotalAmount()}`,
      `Items Selected: ${selectedItemsDetails.length}`
    ];

    this.successPopupData = {
      title: 'Intent Shared Successfully! 🎉',
      message: 'Your intent has been shared with the mess owner. They will be notified about your visit!',
      orderId: response.orderId,
      details: details,
      showOrderId: true
    };

    this.showSuccessPopup = true;
  }

  // Close success popup
  closeSuccessPopup() {
    this.showSuccessPopup = false;
    // Clear the form after successful submission
    this.selectedItems.clear();
    this.headCount = 1;
  }

  // Share intent with mess owner
  shareIntent() {
    if (this.isSharingIntent) return; // Prevent multiple calls

    this.isSharingIntent = true;

    const orderData: OrderData = {
      messId: this.messId || 0,
      messName: this.messName,
      selectedItems: this.getSelectedItemsWithDetails(),
      headCount: this.headCount,
      totalAmount: this.getTotalAmount(),
      timestamp: new Date()
    };

    this.orderService.shareIntent(orderData).subscribe({
      next: (response: OrderResponse) => {
        this.isSharingIntent = false;

        if (response.success) {
          this.showSuccessPopupWithData(response);
        } else {
          alert('Failed to share intent. Please try again.');
        }
      },
      error: (error) => {
        console.error('Failed to share intent:', error);
        alert('Failed to share intent. Please try again.');
        this.isSharingIntent = false;
      }
    });
  }
  // Helper method to generate spicy indicators
  getSpicyIndicators(level: number): number[] {
    return Array(level).fill(0);
  }

  getThaliData(){
      this.thaliService.getMessSpecicficThalis(this.messId ? this.messId : 0 ).subscribe({
        next: (res) => {
         this.menuItems  = res.data ;
        },
        error: (error) => {
          // this.snackBar.showError('Error updating thali: ' + error.message);
        }
      });
  }
}

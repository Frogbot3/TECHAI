import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
  if (!session) {
    return NextResponse.json({ success: true, wishlist: [] });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.id).select("wishlist");
    if (!user) {
      return NextResponse.json({ success: true, wishlist: [] });
    }
    return NextResponse.json({
      success: true,
      wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      wishlist: [],
      message: (error as Error).message,
    });
  }
}

export async function POST(req: Request) {
  const session = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required for cloud wishlist sync" },
      { status: 401 }
    );
  }

  try {
    const { productId, action } = await req.json();
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ success: false, message: "Valid productId required" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User account not found" }, { status: 404 });
    }

    let currentWishlist: string[] = Array.isArray(user.wishlist) ? user.wishlist : [];

    if (action === "add") {
      if (!currentWishlist.includes(productId)) {
        currentWishlist.push(productId);
      }
    } else if (action === "remove") {
      currentWishlist = currentWishlist.filter((id) => id !== productId);
    } else {
      // Toggle
      if (currentWishlist.includes(productId)) {
        currentWishlist = currentWishlist.filter((id) => id !== productId);
      } else {
        currentWishlist.push(productId);
      }
    }

    user.wishlist = currentWishlist;
    await user.save();

    return NextResponse.json({
      success: true,
      wishlist: currentWishlist,
      message: "Wishlist updated in MongoDB",
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: (error as Error).message,
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { productId } = await req.json();
    await connectToDatabase();
    
    if (productId) {
      await User.findByIdAndUpdate(session.id, {
        $pull: { wishlist: productId },
      });
    } else {
      // Clear all
      await User.findByIdAndUpdate(session.id, {
        $set: { wishlist: [] },
      });
    }

    const updatedUser = await User.findById(session.id).select("wishlist");
    return NextResponse.json({
      success: true,
      wishlist: updatedUser?.wishlist || [],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: (error as Error).message,
    }, { status: 500 });
  }
}

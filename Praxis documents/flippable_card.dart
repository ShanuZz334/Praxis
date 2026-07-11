import 'dart:math';
import 'package:flutter/material.dart';

/// A reusable widget that provides a 3D flip animation between a front and back widget.
/// Based on the mechanism used in the GeoFace mobile app.
class FlippableCard extends StatefulWidget {
  final Widget front;
  final Widget back;
  final Duration duration;

  const FlippableCard({
    Key? key,
    required this.front,
    required this.back,
    this.duration = const Duration(milliseconds: 700),
  }) : super(key: key);

  @override
  State<FlippableCard> createState() => FlippableCardState();
}

class FlippableCardState extends State<FlippableCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;
  bool _isFlipped = false;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: widget.duration,
    );
    // Using easeInOutBack curve to match the exact bounce effect from GeoFace
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOutBack),
    );
  }

  void toggleFlip() {
    if (_isFlipped) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() => _isFlipped = !_isFlipped);
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _flipAnimation,
      builder: (context, _) {
        final value = _flipAnimation.value;
        final angle = value * pi;
        final isFront = value < 0.5;

        return Transform(
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.001) // perspective
            ..rotateY(angle),
          alignment: Alignment.center,
          child: isFront
              ? widget.front
              : Transform(
                  // Flip the back content so it's not mirrored
                  transform: Matrix4.identity()..rotateY(pi),
                  alignment: Alignment.center,
                  child: widget.back,
                ),
        );
      },
    );
  }
}
